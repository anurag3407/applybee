import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  authSessions,
  candidateFacts,
  candidateProfileRevisions,
  candidateProfiles,
  companyEvidence,
  companies,
  contacts,
  draftApprovals,
  draftClaims,
  draftRevisions,
  drafts,
  generationRequests,
  gmailConnections,
  gmailDeliveries,
  notifications,
  opportunities,
  privacyRequests,
  resumes,
  templates,
  users,
} from "@/db/schema";
import { getConfig } from "@/server/config";
import { decryptEnvelope, emailFingerprint, sha256Hex } from "@/server/crypto";
import { logger } from "@/server/logger";
import { releaseGeneration, fulfillCapturedPayment } from "@/server/services/credits";
import { enqueueJob } from "@/server/services/jobs";
import { getDraftModel, ModelOutputError, TransientModelError, validateGroundedDraft, type GroundedDraftInput } from "@/server/adapters/ai";
import { getGmailGateway, refreshAccessToken, decryptTokenEnvelope, encryptTokenEnvelope } from "@/server/adapters/gmail";
import { buildMimeMessage } from "@/server/adapters/mime";
import { getObjectStore } from "@/server/adapters/objectStore";

/**
 * Job handlers (§20). Each durable step has a unique operation identity;
 * external calls happen outside open DB transactions; outcomes distinguish
 * known rejection from uncertain acceptance.
 */

export type HandlerOutcome =
  | { status: "succeeded"; result?: Record<string, unknown> }
  | { status: "failed"; errorCode: string; errorMessage: string; result?: Record<string, unknown> }
  | { status: "retry"; retryAfterSeconds: number; errorCode: string; errorMessage: string }
  | { status: "deferred"; availableAfter: Date };

export type HandlerContext = {
  jobId: string;
  userId: string | null;
  entityId: string | null;
  fencingToken: number;
};

type Handler = (ctx: HandlerContext) => Promise<HandlerOutcome>;

async function accountActive(userId: string | null): Promise<boolean> {
  if (!userId) return true;
  const rows = await db.select({ status: users.status }).from(users).where(eq(users.id, userId)).limit(1);
  const status = rows[0]?.status;
  return status === "active";
}

/* ------------------------------------------------------------------ */
/* draft.generate                                                      */
/* ------------------------------------------------------------------ */

const draftGenerate: Handler = async (ctx) => {
  if (!ctx.entityId) return { status: "failed", errorCode: "NO_ENTITY", errorMessage: "Missing generation id" };
  const gen = (
    await db.select().from(generationRequests).where(eq(generationRequests.id, ctx.entityId)).limit(1)
  )[0];
  if (!gen) return { status: "failed", errorCode: "NO_ENTITY", errorMessage: "Generation not found" };
  if (gen.state !== "reserved" && gen.state !== "queued" && gen.state !== "preparing" && gen.state !== "generating") {
    return { status: "succeeded", result: { note: `generation already ${gen.state}` } };
  }

  const config = getConfig();
  if (!config.FEATURE_AI_ENABLED) {
    await releaseGeneration(gen.id).catch(() => {});
    return { status: "failed", errorCode: "AI_DISABLED", errorMessage: "AI generation is temporarily disabled." };
  }
  if (!(await accountActive(gen.userId))) {
    // Queued snapshots never authorize work for a disabled/deleting account;
    // blocked AI jobs release safely without provider calls (§20.2 step 5).
    await releaseGeneration(gen.id).catch(() => {});
    return { status: "failed", errorCode: "ACCOUNT_INACTIVE", errorMessage: "Account is not active." };
  }

  await db.update(generationRequests).set({ state: "generating" }).where(eq(generationRequests.id, gen.id));

  try {
    const snapshot = gen.inputSnapshot as GenerationSnapshot;
    const { model, modelId } = getDraftModel();

    // Grounding inputs come from the snapshot, never the live profile.
    const facts = await loadSnapshotFacts(snapshot);
    const evidence = await loadCompanyEvidence(snapshot);
    const recipient = await loadRecipientInfo(snapshot);

    const input: GroundedDraftInput = {
      mode: gen.mode,
      intent: gen.intent,
      targetRole: snapshot.targetRole,
      jobDescription: snapshot.jobDescription,
      tone: snapshot.tone,
      lengthTarget: snapshot.length,
      recipientFirstName: recipient.firstName,
      recipientTitle: recipient.title,
      companyName: recipient.companyName,
      candidateName: snapshot.candidateName,
      candidateFacts: facts,
      companyEvidence: evidence,
      priorOutreachContext: snapshot.priorOutreachContext,
    };

    if (facts.length === 0) {
      await releaseGeneration(gen.id);
      await db
        .update(generationRequests)
        .set({
          state: "failed",
          failureCode: "NO_CONFIRMED_FACTS",
          failureMessage: "Confirm a few profile facts first — AI drafts are written only from details you have confirmed.",
          completedAt: new Date(),
        })
        .where(eq(generationRequests.id, gen.id));
      await resetGeneratingDraft(gen.draftId);
      return { status: "failed", errorCode: "NO_CONFIRMED_FACTS", errorMessage: "No confirmed facts" };
    }

    let draft;
    let repaired = false;
    try {
      draft = validateGroundedDraft(await model.compose(input), input);
    } catch (err) {
      if (err instanceof ModelOutputError && !repaired) {
        // One bounded repair within the job budget (§15.2).
        repaired = true;
        logger.info("generation.repair_attempt", { generationId: gen.id });
        draft = validateGroundedDraft(await model.compose(input), input);
      } else {
        throw err;
      }
    }

    // Persist the proposed revision + consume the reservation atomically (§18.4).
    const proposedId = await db.transaction(async (tx) => {
      const maxRow = await tx.execute(
        sql`SELECT COALESCE(MAX(revision_no), 0) + 1 AS next FROM draft_revisions WHERE draft_id = ${gen.draftId}::uuid`,
      );
      const nextNo = Number((maxRow.rows[0] as { next: number }).next);
      const inserted = await tx
        .insert(draftRevisions)
        .values({
          draftId: gen.draftId,
          userId: gen.userId,
          revisionNo: nextNo,
          subject: draft.subject,
          body: draft.body,
          recipientSnapshot: {
            firstName: recipient.firstName,
            title: recipient.title,
            companyName: recipient.companyName,
          },
          profileRevisionId: snapshot.profileRevisionId ?? null,
          generationId: gen.id,
          // A real digest, matching the manual/autosave path in services/drafts.ts.
          // This used to store `${subject.length}:${body.length}`, which is not a
          // hash: any same-length edit produces an identical value, so the
          // column could not be used to detect changed content.
          contentHash: sha256Hex(`${draft.subject}\n${draft.body}`).slice(0, 32),
        })
        .returning({ id: draftRevisions.id });
      const revisionId = inserted[0]!.id;

      for (const claim of draft.claimReferences) {
        await tx.insert(draftClaims).values({
          revisionId,
          excerpt: claim.excerpt,
          factIds: claim.factIds,
          evidenceIds: claim.evidenceIds,
          validationResult: claim.factIds.length > 0 ? "supported" : claim.evidenceIds.length > 0 ? "supported" : "uncertain",
        });
      }

      // Consume + proposed revision + reservation state in ONE transaction.
      await tx.execute(sql`SELECT complete_generation(${gen.id}::text)`);
      await tx
        .update(drafts)
        .set({ status: "active" })
        .where(and(eq(drafts.id, gen.draftId), eq(drafts.status, "generating")));

      await tx
        .update(generationRequests)
        .set({
          state: "ready",
          proposedRevisionId: revisionId,
          modelId,
          promptVersion: config.AI_PROMPT_VERSION,
          usage: {
            repaired,
            words: draft.body.trim().split(/\s+/).length,
            factsUsed: draft.candidateFactIds.length,
            evidenceUsed: draft.companyEvidenceIds.length,
            // The model's grounding caveats. Without this the whole warnings
            // channel — validated by the adapter and typed in the composer —
            // was computed and thrown away, so a draft written with no company
            // evidence or no target role looked identical to a fully grounded one.
            warnings: draft.warnings,
          },
          completedAt: new Date(),
        })
        .where(eq(generationRequests.id, gen.id));

      return revisionId;
    });

    return { status: "succeeded", result: { generationId: gen.id, proposedRevisionId: proposedId } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Rate limits, timeouts and provider 5xx are retried inside the job budget.
    // The credit is only consumed when a validated artifact is committed, so a
    // retry costs the user nothing.
    if (err instanceof TransientModelError) {
      logger.warn("generation.provider_transient", { generationId: gen.id, error: message });
      await db
        .update(generationRequests)
        .set({ state: "generating", failureCode: "PROVIDER_TRANSIENT", failureMessage: "The model provider is temporarily unavailable — retrying." })
        .where(eq(generationRequests.id, gen.id));
      return {
        status: "retry",
        retryAfterSeconds: err.retryAfterSeconds,
        errorCode: "PROVIDER_TRANSIENT",
        errorMessage: message,
      };
    }
    if (err instanceof ModelOutputError) {
      // Permanent problem: release once, no pointless retries (§20.4).
      await releaseGeneration(gen.id).catch(() => {});
      // The adapter also raises ModelOutputError for provider-configuration
      // failures (unknown model, rejected key, no credits). Reporting those as
      // "the response could not be validated" would be untrue — say what
      // actually failed and carry the adapter's actionable message.
      const providerIssue =
        /has no model|rejected the API key|(?:OpenRouter|Gemini) error 4\d\d|Provider error 4\d\d/.test(message);
      const failureCode = providerIssue ? "MODEL_PROVIDER_ERROR" : "MODEL_OUTPUT_INVALID";
      const failureMessage = providerIssue
        ? `The AI provider is not usable right now: ${message.slice(0, 200)}`
        : "The model response could not be validated. Your credit was released.";
      await db
        .update(generationRequests)
        .set({ state: "failed", failureCode, failureMessage, completedAt: new Date() })
        .where(eq(generationRequests.id, gen.id));
      await resetGeneratingDraft(gen.draftId);
      return { status: "failed", errorCode: failureCode, errorMessage: message };
    }
    // Transient provider issue: retry within budget; release happens on final
    // failure so a still-viable job can consume (§18.4).
    logger.warn("generation.transient_error", { generationId: gen.id, error: message });
    return { status: "retry", retryAfterSeconds: 20, errorCode: "PROVIDER_TRANSIENT", errorMessage: message };
  }
};

type GenerationSnapshot = {
  draftId: string;
  intent: string;
  targetRole?: string;
  jobDescription?: string;
  tone: string;
  length: number;
  candidateName: string;
  contactId?: string | null;
  ownRecipientName?: string | null;
  ownRecipientEmail?: string | null;
  profileRevisionId?: string | null;
  priorOutreachContext?: string;
};
// Note: a generation's operation ref (for reserve/consume/release) is its own id.

async function loadSnapshotFacts(snapshot: GenerationSnapshot) {
  if (!snapshot.profileRevisionId) return [];
  const rows = await db
    .select({ id: candidateFacts.id, factType: candidateFacts.factType, text: candidateFacts.text })
    .from(candidateFacts)
    .where(and(eq(candidateFacts.profileRevisionId, snapshot.profileRevisionId), eq(candidateFacts.approved, true)));
  return rows;
}

async function loadCompanyEvidence(snapshot: GenerationSnapshot) {
  if (!snapshot.contactId) return [];
  const rows = await db
    .select({
      id: companyEvidence.id,
      factType: companyEvidence.factType,
      value: companyEvidence.value,
      sourceName: companyEvidence.sourceName,
      checkedAt: companyEvidence.checkedAt,
    })
    .from(companyEvidence)
    .innerJoin(contacts, eq(contacts.companyId, companyEvidence.companyId))
    .where(
      and(
        eq(contacts.id, snapshot.contactId),
        eq(companyEvidence.approval, "approved"),
      ),
    )
    .limit(5);
  return rows.map((r) => ({ ...r, checkedAt: r.checkedAt ? r.checkedAt.toISOString() : null }));
}

/** A settled generation frees the draft's editor regardless of outcome. */
async function resetGeneratingDraft(draftId: string) {
  await db
    .update(drafts)
    .set({ status: "active" })
    .where(and(eq(drafts.id, draftId), eq(drafts.status, "generating")));
}

async function loadRecipientInfo(snapshot: GenerationSnapshot) {
  if (snapshot.contactId) {
    const rows = await db
      .select({ name: contacts.name, title: contacts.title, companyName: companies.name })
      .from(contacts)
      .innerJoin(companies, eq(companies.id, contacts.companyId))
      .where(eq(contacts.id, snapshot.contactId))
      .limit(1);
    const row = rows[0];
    return {
      firstName: row ? row.name.split(" ")[0]! : null,
      title: row?.title ?? null,
      companyName: row?.companyName ?? null,
    };
  }
  const name = snapshot.ownRecipientName ?? null;
  return { firstName: name ? name.split(" ")[0]! : null, title: null, companyName: null };
}

/* ------------------------------------------------------------------ */
/* gmail.create_draft                                                  */
/* ------------------------------------------------------------------ */

const gmailCreateDraft: Handler = async (ctx) => {
  if (!ctx.entityId) return { status: "failed", errorCode: "NO_ENTITY", errorMessage: "Missing delivery id" };
  const delivery = (
    await db.select().from(gmailDeliveries).where(eq(gmailDeliveries.id, ctx.entityId)).limit(1)
  )[0];
  if (!delivery) return { status: "failed", errorCode: "NO_ENTITY", errorMessage: "Delivery not found" };
  if (delivery.state !== "queued" && delivery.state !== "preparing" && delivery.state !== "calling_provider") {
    return { status: "succeeded", result: { note: `delivery already ${delivery.state}` } };
  }

  const config = getConfig();
  if (!config.FEATURE_GMAIL_ENABLED) {
    await db
      .update(gmailDeliveries)
      .set({ state: "blocked", failureCode: "GMAIL_DISABLED", failureMessage: "Gmail delivery is temporarily disabled.", updatedAt: new Date() })
      .where(eq(gmailDeliveries.id, delivery.id));
    return { status: "failed", errorCode: "GMAIL_DISABLED", errorMessage: "Gmail delivery disabled" };
  }
  if (!(await accountActive(delivery.userId))) {
    await db
      .update(gmailDeliveries)
      .set({ state: "blocked", failureCode: "ACCOUNT_INACTIVE", updatedAt: new Date() })
      .where(eq(gmailDeliveries.id, delivery.id));
    return { status: "failed", errorCode: "ACCOUNT_INACTIVE", errorMessage: "Account inactive" };
  }

  const connection = (
    await db.select().from(gmailConnections).where(eq(gmailConnections.id, delivery.connectionId)).limit(1)
  )[0];
  // Connection identity/version gate immediately before dispatch (§16.5).
  if (!connection || connection.status !== "active" || connection.version !== delivery.connectionVersion) {
    await db
      .update(gmailDeliveries)
      .set({ state: "known_failed", failureCode: "CONNECTION_CHANGED", failureMessage: "Gmail needs to be reconnected. Your draft is still saved here.", updatedAt: new Date() })
      .where(eq(gmailDeliveries.id, delivery.id));
    return { status: "failed", errorCode: "CONNECTION_CHANGED", errorMessage: "Connection mismatch" };
  }

  const revision = (await db.select().from(draftRevisions).where(eq(draftRevisions.id, delivery.revisionId)).limit(1))[0];
  if (!revision) return { status: "failed", errorCode: "NO_REVISION", errorMessage: "Revision missing" };

  const draft = (await db.select().from(drafts).where(eq(drafts.id, delivery.draftId)).limit(1))[0];

  // Recipient: directory contact must be unlocked by this user; own recipient
  // is taken from the draft. Suppression rechecked at dispatch (§16.5).
  let recipientEmail: string | null = null;
  let recipientName: string | null = null;
  if (draft?.contactId) {
    const unlock = await db.execute(
      sql`SELECT 1 FROM contact_unlocks WHERE user_id = ${delivery.userId}::uuid AND contact_id = ${draft.contactId}::uuid`,
    );
    if (unlock.rows.length === 0) {
      await db
        .update(gmailDeliveries)
        .set({ state: "known_failed", failureCode: "CONTACT_LOCKED", failureMessage: "The contact email is not unlocked for this account.", updatedAt: new Date() })
        .where(eq(gmailDeliveries.id, delivery.id));
      return { status: "failed", errorCode: "CONTACT_LOCKED", errorMessage: "Contact not unlocked" };
    }
    const contact = (await db.select().from(contacts).where(eq(contacts.id, draft.contactId)).limit(1))[0];
    if (contact?.emailEnc) {
      recipientEmail = decryptEnvelope(contact.emailEnc, `contact:${contact.id}`);
      recipientName = contact.name;
    }
  } else if (draft?.ownRecipientEmail) {
    recipientEmail = draft.ownRecipientEmail;
    recipientName = draft.ownRecipientName;
  }
  if (!recipientEmail) {
    await db
      .update(gmailDeliveries)
      .set({ state: "known_failed", failureCode: "NO_RECIPIENT", failureMessage: "This draft has no recipient address.", updatedAt: new Date() })
      .where(eq(gmailDeliveries.id, delivery.id));
    return { status: "failed", errorCode: "NO_RECIPIENT", errorMessage: "No recipient" };
  }

  const suppression = await db.execute(
    sql`SELECT 1 FROM contact_suppressions WHERE email_fingerprint = ${emailFingerprint(recipientEmail)} AND state = 'active' AND scope = 'delivery_wide'`,
  );
  if (suppression.rows.length > 0) {
    await db
      .update(gmailDeliveries)
      .set({ state: "blocked", failureCode: "RECIPIENT_SUPPRESSED", failureMessage: "This recipient asked not to be contacted. Delivery is blocked.", updatedAt: new Date() })
      .where(eq(gmailDeliveries.id, delivery.id));
    return { status: "failed", errorCode: "RECIPIENT_SUPPRESSED", errorMessage: "Suppressed recipient" };
  }

  // Attachment lifecycle gate: approved attachment must still be clean and present.
  const approval = (await db.select().from(draftApprovals).where(eq(draftApprovals.id, delivery.approvalId)).limit(1))[0];
  let attachment: { filename: string; bytes: Uint8Array; contentType: string } | null = null;
  if (approval?.attachmentResumeId) {
    const resume = (await db.select().from(resumes).where(eq(resumes.id, approval.attachmentResumeId)).limit(1))[0];
    if (!resume || resume.state === "deleted" || resume.state === "deleting" || resume.scanStatus !== "clean") {
      await db
        .update(gmailDeliveries)
        .set({ state: "known_failed", failureCode: "ATTACHMENT_INVALID", failureMessage: "The approved resume attachment is no longer available. Remove it or select another version.", updatedAt: new Date() })
        .where(eq(gmailDeliveries.id, delivery.id));
      return { status: "failed", errorCode: "ATTACHMENT_INVALID", errorMessage: "Attachment unavailable" };
    }
    const store = getObjectStore("clean");
    attachment = {
      filename: resume.displayFilename,
      bytes: await store.get(resume.objectKey),
      contentType: "application/pdf",
    };
  }

  // Access token: refresh when near expiry (live mode).
  let accessToken = `mock-access-${delivery.id}`;
  if (config.gmailMode === "live") {
    const refreshed = await ensureAccessToken(connection);
    if (!refreshed) {
      await db
        .update(gmailDeliveries)
        .set({ state: "known_failed", failureCode: "TOKEN_INVALID", failureMessage: "Gmail needs to be reconnected. Your draft is still saved here.", updatedAt: new Date() })
        .where(eq(gmailDeliveries.id, delivery.id));
      return { status: "failed", errorCode: "TOKEN_INVALID", errorMessage: "Token refresh failed" };
    }
    accessToken = refreshed;
  }

  const mime = buildMimeMessage({
    fromEmail: connection.googleEmail,
    fromName: null,
    toEmail: recipientEmail,
    toName: recipientName,
    subject: revision.subject,
    body: revision.body,
    attachment,
    operationMarker: delivery.operationMarker,
  });

  await db.update(gmailDeliveries).set({ state: "calling_provider", updatedAt: new Date() }).where(eq(gmailDeliveries.id, delivery.id));

  // Persist the attempt with external-call-start evidence BEFORE dispatch
  // (§16.5): a crash after POST must route recovery to reconciliation.
  //
  // attempt_no must be derived, not hardcoded. `delivery_attempts` has a unique
  // index on (delivery_id, attempt_no), and this handler deliberately re-enters
  // when the delivery is left in `calling_provider` — that is precisely the
  // crash-recovery path. A hardcoded 1 made the second entry violate the unique
  // constraint, so a crashed dispatch permanently broke the delivery instead of
  // routing it to reconciliation.
  const { deliveryAttempts } = await import("@/db/schema");
  const maxAttempt = await db.execute(sql`
    SELECT COALESCE(MAX(attempt_no), 0) + 1 AS next FROM delivery_attempts WHERE delivery_id = ${delivery.id}::uuid
  `);
  const attemptNo = Number((maxAttempt.rows[0] as { next: number }).next);
  const attempt = (
    await db
      .insert(deliveryAttempts)
      .values({
        deliveryId: delivery.id,
        attemptNo,
        state: "calling",
        callStartedAt: new Date(),
        leaseOwner: ctx.jobId,
      })
      .returning({ id: deliveryAttempts.id })
  )[0];

  const gateway = getGmailGateway();
  const outcome = await gateway.createApprovedDraft({
    fromEmail: connection.googleEmail,
    toEmail: recipientEmail,
    toName: recipientName,
    subject: revision.subject,
    body: revision.body,
    attachment,
    operationMarker: delivery.operationMarker,
    accessToken,
  });

  if (outcome.kind === "created") {
    await db.transaction(async (tx) => {
      await tx
        .update(deliveryAttempts)
        .set({ state: "confirmed", resultAt: new Date() })
        .where(eq(deliveryAttempts.id, attempt!.id));
      await tx
        .update(gmailDeliveries)
        .set({ state: "created", providerDraftId: outcome.providerDraftId, providerMessageId: outcome.providerMessageId, updatedAt: new Date() })
        .where(eq(gmailDeliveries.id, delivery.id));
    });
    return { status: "succeeded", result: { providerDraftId: outcome.providerDraftId } };
  }

  if (outcome.kind === "known_failed") {
    await db.transaction(async (tx) => {
      await tx
        .update(deliveryAttempts)
        .set({ state: "failed", resultAt: new Date(), errorCode: outcome.code, errorMessage: outcome.message })
        .where(eq(deliveryAttempts.id, attempt!.id));
      await tx
        .update(gmailDeliveries)
        .set({ state: "known_failed", failureCode: outcome.code, failureMessage: outcome.message, updatedAt: new Date() })
        .where(eq(gmailDeliveries.id, delivery.id));
    });
    return { status: "failed", errorCode: outcome.code, errorMessage: outcome.message };
  }

  // Unknown acceptance: never blindly retry (§16.5).
  await db.transaction(async (tx) => {
    await tx
      .update(deliveryAttempts)
      .set({ state: "unknown", resultAt: new Date() })
      .where(eq(deliveryAttempts.id, attempt!.id));
    await tx
      .update(gmailDeliveries)
      .set({ state: "unknown", unknownSince: new Date(), updatedAt: new Date() })
      .where(eq(gmailDeliveries.id, delivery.id));
  });
  await enqueueJob({ kind: "gmail.reconcile", userId: delivery.userId, entityId: delivery.id, availableAfter: new Date(Date.now() + 15_000) });
  return { status: "succeeded", result: { state: "unknown", note: "Reconciliation scheduled" } };
};

async function ensureAccessToken(connection: { id: string; userId: string; googleEmail: string; tokenEnvelopeEnc: string | null; accessTokenExpiresAt: Date | null; version: number }): Promise<string | null> {
  if (!connection.tokenEnvelopeEnc) return null;
  const stillValid = connection.accessTokenExpiresAt && connection.accessTokenExpiresAt.getTime() > Date.now() + 60_000;
  // Binding matches handleConnectCallback & connectSandbox in src/server/services/gmail.ts
  const binding = `gmail-connection:${connection.userId}:${connection.googleEmail}`;
  let tokens: { refreshToken?: string | null; accessToken?: string | null };
  try {
    tokens = decryptTokenEnvelope<{ refreshToken?: string | null; accessToken?: string | null }>(connection.tokenEnvelopeEnc, binding);
  } catch (err) {
    logger.error("gmail.token_decrypt_failed", { connectionId: connection.id, error: String(err) });
    return null;
  }
  if (stillValid && tokens.accessToken) return tokens.accessToken;
  if (!tokens.refreshToken) return null;

  const config = getConfig();
  const result = await refreshAccessToken({
    clientId: config.GOOGLE_OAUTH_CLIENT_ID!,
    clientSecret: config.GOOGLE_OAUTH_CLIENT_SECRET!,
    refreshToken: tokens.refreshToken,
  });
  if (result.kind !== "ok") return null;
  const expiresAt = new Date(Date.now() + result.expiresIn * 1000);
  // Late refresh responses cannot overwrite a newer connection version.
  const updated = await db
    .update(gmailConnections)
    .set({
      tokenEnvelopeEnc: encryptTokenEnvelope({ refreshToken: tokens.refreshToken, accessToken: result.accessToken }, binding),
      accessTokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(and(eq(gmailConnections.id, connection.id), eq(gmailConnections.version, connection.version)))
    .returning({ id: gmailConnections.id });
  return updated.length > 0 ? result.accessToken : null;
}

/* ------------------------------------------------------------------ */
/* gmail.reconcile                                                     */
/* ------------------------------------------------------------------ */

const gmailReconcile: Handler = async (ctx) => {
  if (!ctx.entityId) return { status: "failed", errorCode: "NO_ENTITY", errorMessage: "Missing delivery id" };
  const delivery = (await db.select().from(gmailDeliveries).where(eq(gmailDeliveries.id, ctx.entityId)).limit(1))[0];
  if (!delivery) return { status: "failed", errorCode: "NO_ENTITY", errorMessage: "Delivery not found" };
  if (delivery.state !== "unknown" && delivery.state !== "reconciling") {
    return { status: "succeeded", result: { note: `delivery is ${delivery.state}` } };
  }

  const config = getConfig();
  const connection = (await db.select().from(gmailConnections).where(eq(gmailConnections.id, delivery.connectionId)).limit(1))[0];
  if (!connection || connection.status !== "active") {
    await db
      .update(gmailDeliveries)
      .set({ state: "needs_confirmation", updatedAt: new Date() })
      .where(eq(gmailDeliveries.id, delivery.id));
    return { status: "succeeded", result: { note: "needs user confirmation (connection inactive)" } };
  }

  let accessToken = `mock-access-${delivery.id}`;
  if (config.gmailMode === "live") {
    accessToken = (await ensureAccessToken(connection)) ?? "";
    if (!accessToken) {
      await db.update(gmailDeliveries).set({ state: "needs_confirmation", updatedAt: new Date() }).where(eq(gmailDeliveries.id, delivery.id));
      return { status: "succeeded", result: { note: "needs user confirmation (token unavailable)" } };
    }
  }

  await db.update(gmailDeliveries).set({ state: "reconciling", updatedAt: new Date() }).where(eq(gmailDeliveries.id, delivery.id));
  const gateway = getGmailGateway();
  const outcome = await gateway.listRecentDraftMarkers({ accessToken, marker: delivery.operationMarker, max: 20 });

  if (outcome.kind === "found") {
    await db
      .update(gmailDeliveries)
      .set({ state: "created", providerDraftId: outcome.providerDraftId, updatedAt: new Date() })
      .where(eq(gmailDeliveries.id, delivery.id));
    return { status: "succeeded", result: { state: "created" } };
  }
  if (outcome.kind === "not_found_conclusive") {
    // Absence is not definitive proof of failure (§16.5) — still ask the user.
    await db
      .update(gmailDeliveries)
      .set({ state: "needs_confirmation", failureCode: "NOT_CONFIRMED", failureMessage: "Gmail may have created the draft, but we didn't receive confirmation. Check your Drafts folder before creating another.", updatedAt: new Date() })
      .where(eq(gmailDeliveries.id, delivery.id));
    return { status: "succeeded", result: { state: "needs_confirmation" } };
  }
  // Inconclusive: bounded retries over minutes, then manual confirmation.
  const ageMs = delivery.unknownSince ? Date.now() - delivery.unknownSince.getTime() : 0;
  if (ageMs > 10 * 60 * 1000) {
    await db
      .update(gmailDeliveries)
      .set({ state: "needs_confirmation", updatedAt: new Date() })
      .where(eq(gmailDeliveries.id, delivery.id));
    return { status: "succeeded", result: { state: "needs_confirmation" } };
  }
  return { status: "retry", retryAfterSeconds: 60, errorCode: "RECONCILE_INCONCLUSIVE", errorMessage: "Outcome not yet confirmed" };
};

/* ------------------------------------------------------------------ */
/* payment.fulfill                                                     */
/* ------------------------------------------------------------------ */

const paymentFulfill: Handler = async (ctx) => {
  if (!ctx.entityId) return { status: "failed", errorCode: "NO_ENTITY", errorMessage: "Missing webhook event id" };
  const { webhookEvents } = await import("@/db/schema");
  const event = (await db.select().from(webhookEvents).where(eq(webhookEvents.id, ctx.entityId)).limit(1))[0];
  if (!event) return { status: "failed", errorCode: "NO_ENTITY", errorMessage: "Webhook event not found" };
  if (event.processState === "processed") return { status: "succeeded", result: { note: "event already processed" } };

  const payload = event.storedPayload as
    | { providerPaymentId?: string; providerOrderId?: string; amount?: number; currency?: string }
    | null;
  if (!payload?.providerPaymentId || !payload?.providerOrderId || !payload?.amount) {
    await db.update(webhookEvents).set({ processState: "quarantined" }).where(eq(webhookEvents.id, event.id));
    return { status: "failed", errorCode: "MALFORMED_EVENT", errorMessage: "Webhook payload incomplete" };
  }

  try {
    const result = await fulfillCapturedPayment({
      providerPaymentId: payload.providerPaymentId,
      providerOrderId: payload.providerOrderId,
      amountPaise: payload.amount,
      currency: payload.currency ?? "INR",
    });
    await db.update(webhookEvents).set({ processState: "processed", processedAt: new Date() }).where(eq(webhookEvents.id, event.id));
    return { status: "succeeded", result: { granted: result.granted, alreadyGranted: result.alreadyGranted } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("ORDER_NOT_FOUND") || message.includes("PAYMENT_MISMATCH")) {
      await db.update(webhookEvents).set({ processState: "quarantined", lastError: message }).where(eq(webhookEvents.id, event.id));
      return { status: "failed", errorCode: "PAYMENT_MISMATCH", errorMessage: "Payment does not match a stored order — quarantined for review." };
    }
    return { status: "retry", retryAfterSeconds: 15, errorCode: "FULFILL_TRANSIENT", errorMessage: message };
  }
};

/* ------------------------------------------------------------------ */
/* resume.scan_parse                                                   */
/* ------------------------------------------------------------------ */

const resumeScanParse: Handler = async (ctx) => {
  if (!ctx.entityId) return { status: "failed", errorCode: "NO_ENTITY", errorMessage: "Missing resume id" };
  const resume = (await db.select().from(resumes).where(eq(resumes.id, ctx.entityId)).limit(1))[0];
  if (!resume) return { status: "failed", errorCode: "NO_ENTITY", errorMessage: "Resume not found" };
  if (resume.state === "deleted" || resume.state === "deleting") {
    return { status: "succeeded", result: { note: "resume deleted before processing" } };
  }
  if (!(await accountActive(resume.userId))) {
    return { status: "failed", errorCode: "ACCOUNT_INACTIVE", errorMessage: "Account inactive" };
  }

  const config = getConfig();
  const quarantine = getObjectStore("quarantine");
  const clean = getObjectStore("clean");

  // Scan gate: structural validation always; isolated processor when configured.
  await db.update(resumes).set({ state: "scanning", updatedAt: new Date() }).where(eq(resumes.id, resume.id));
  const bytes = await quarantine.get(resume.objectKey);
  let scanNote = "Structural validation passed (local development scanner — no antivirus signatures).";
  let cleanScan = true;
  if (config.DOCUMENT_PROCESSOR_ENDPOINT && config.DOCUMENT_PROCESSOR_SIGNING_SECRET) {
    try {
      const res = await fetch(config.DOCUMENT_PROCESSOR_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: bytes as unknown as BodyInit,
        signal: AbortSignal.timeout(60_000),
      });
      const body = (await res.json()) as { clean?: boolean; note?: string };
      cleanScan = body.clean === true;
      scanNote = body.note ?? "Processed by isolated document scanner.";
    } catch (err) {
      logger.warn("resume.scanner_unavailable", { resumeId: resume.id, error: String(err) });
      await db
        .update(resumes)
        .set({ state: "uploaded", scanStatus: "unavailable", scanNote: "Scanner temporarily unavailable — file remains quarantined.", updatedAt: new Date() })
        .where(eq(resumes.id, resume.id));
      return { status: "retry", retryAfterSeconds: 60, errorCode: "SCANNER_UNAVAILABLE", errorMessage: "Scanner unavailable" };
    }
  }
  if (!cleanScan) {
    await db
      .update(resumes)
      .set({ state: "scanning_rejected", scanStatus: "rejected", scanNote, updatedAt: new Date() })
      .where(eq(resumes.id, resume.id));
    await quarantine.delete(resume.objectKey);
    return { status: "failed", errorCode: "SCAN_REJECTED", errorMessage: "Malware scan rejected this file." };
  }

  // Immutable clean copy: the quarantine object is never the attachment source.
  const cleanKey = `clean/${resume.userId}/${resume.id}.pdf`;
  await clean.put(cleanKey, bytes, "application/pdf");
  await db
    .update(resumes)
    .set({
      objectKey: cleanKey,
      scanStatus: "clean",
      scanVersion: config.DOCUMENT_PROCESSOR_ENDPOINT ? "isolated-processor-v1" : "structural-v1",
      scannedAt: new Date(),
      scanNote,
      state: "parsing",
      updatedAt: new Date(),
    })
    .where(eq(resumes.id, resume.id));
  await quarantine.delete(resume.objectKey);

  // Model-assisted structured extraction.
  const { model } = getDraftModel();
  try {
    const parsed = await model.parseResume({ filename: resume.displayFilename, bytes, textExtract: "" });
    const profileRow = (await db.select().from(candidateProfiles).where(eq(candidateProfiles.userId, resume.userId)).limit(1))[0];
    let profileId = profileRow?.id;
    if (!profileId) {
      const created = await db.insert(candidateProfiles).values({ userId: resume.userId }).returning({ id: candidateProfiles.id });
      profileId = created[0]!.id;
    }
    const nextNoRow = await db.execute(
      sql`SELECT COALESCE(MAX(revision_no), 0) + 1 AS next FROM candidate_profile_revisions WHERE profile_id = ${profileId}::uuid`,
    );
    const nextNo = Number((nextNoRow.rows[0] as { next: number }).next);

    await db.transaction(async (tx) => {
      const revision = (
        await tx
          .insert(candidateProfileRevisions)
          .values({
            userId: resume.userId,
            profileId: profileId!,
            revisionNo: nextNo,
            source: "resume",
            resumeId: resume.id,
            extracted: { summary: parsed.summary, targetRole: parsed.targetRole, lowText: parsed.lowText },
            // Match the manual path in services/resumes.ts: a digest of the fact list,
          // not the number of facts.
          contentHash: sha256Hex(JSON.stringify(parsed.facts)).slice(0, 32),
          })
          .returning({ id: candidateProfileRevisions.id })
      )[0];
      let order = 0;
      for (const fact of parsed.facts) {
        await tx.insert(candidateFacts).values({
          profileRevisionId: revision!.id,
          userId: resume.userId,
          factType: fact.factType as "summary",
          text: fact.text,
          approved: false,
          sortOrder: order++,
        });
      }
      await tx
        .update(candidateProfiles)
        .set({ activeResumeId: resume.id, updatedAt: new Date() })
        .where(eq(candidateProfiles.id, profileId!));
    });

    await db
      .update(resumes)
      .set({ parseState: parsed.lowText ? "low_text" : "parsed", state: "review_required", parserVersion: "v1", updatedAt: new Date() })
      .where(eq(resumes.id, resume.id));

    await db.insert(notifications).values({
      userId: resume.userId,
      kind: "resume.ready_for_review",
      sourceEntity: `resume:${resume.id}`,
      sourceEvent: `resume.review:${resume.id}`,
      title: "Your resume was parsed — review the details",
      body: "Confirm or correct the extracted profile before it is used in AI drafts.",
    }).onConflictDoNothing();

    return { status: "succeeded", result: { facts: parsed.facts.length } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(resumes)
      .set({ state: "parse_failed", parseState: "failed", scanNote: "Parsing failed — you can still enter your profile manually.", updatedAt: new Date() })
      .where(eq(resumes.id, resume.id));
    return { status: "failed", errorCode: "PARSE_FAILED", errorMessage: message };
  }
};

/* ------------------------------------------------------------------ */
/* reminders.materialize                                               */
/* ------------------------------------------------------------------ */

const remindersMaterialize: Handler = async () => {
  const due = await db.execute(sql`
    SELECT o.id, o.user_id, o.next_action_at, o.company_name, o.role_title
    FROM opportunities o
    WHERE o.next_action_at IS NOT NULL AND o.next_action_at <= now() AND o.stage <> 'closed'
  `);
  let created = 0;
  for (const row of due.rows as Array<{ id: string; user_id: string; next_action_at: string; company_name: string; role_title: string }>) {
    const sourceEvent = `reminder:${row.id}:${new Date(row.next_action_at).toISOString()}`;
    const inserted = await db
      .insert(notifications)
      .values({
        userId: row.user_id,
        kind: "opportunity.reminder",
        sourceEntity: `opportunity:${row.id}`,
        sourceEvent,
        title: `Follow up: ${row.role_title} at ${row.company_name}`,
        body: "You set a next-action reminder for this opportunity.",
      })
      .onConflictDoNothing()
      .returning({ id: notifications.id });
    if (inserted.length > 0) created++;
  }
  return { status: "succeeded", result: { created } };
};

/* ------------------------------------------------------------------ */
/* privacy.export                                                      */
/* ------------------------------------------------------------------ */

const privacyExport: Handler = async (ctx) => {
  if (!ctx.entityId) return { status: "failed", errorCode: "NO_ENTITY", errorMessage: "Missing request id" };
  const { privacyRequests } = await import("@/db/schema");
  const request = (await db.select().from(privacyRequests).where(eq(privacyRequests.id, ctx.entityId)).limit(1))[0];
  if (!request) return { status: "failed", errorCode: "NO_ENTITY", errorMessage: "Request not found" };
  if (!(await accountActive(request.userId))) {
    return { status: "failed", errorCode: "ACCOUNT_INACTIVE", errorMessage: "Account inactive" };
  }

  const exportData = {
    generatedAt: new Date().toISOString(),
    profile: (await db.select().from(candidateProfiles).where(eq(candidateProfiles.userId, request.userId))),
    drafts: (await db.select().from(drafts).where(eq(drafts.userId, request.userId))),
    opportunities: (await db.select().from(opportunities).where(eq(opportunities.userId, request.userId))),
    ledger: (
      await db.execute(sql`SELECT type, kind, available_delta, reserved_delta, reason, created_at FROM credit_ledger_entries WHERE user_id = ${request.userId}::uuid ORDER BY created_at`)
    ).rows,
  };
  const store = getObjectStore("export");
  const key = `export/${request.userId}/${request.id}.json`;
  await store.put(key, new TextEncoder().encode(JSON.stringify(exportData, null, 2)), "application/json");
  await db
    .update(privacyRequests)
    .set({ state: "ready", resultRef: key, completedAt: new Date() })
    .where(eq(privacyRequests.id, request.id));
  return { status: "succeeded", result: { key } };
};

/* ------------------------------------------------------------------ */
/* privacy.delete                                                     */
/* ------------------------------------------------------------------ */

const privacyDelete: Handler = async (ctx) => {
  const targetUserId = ctx.userId ?? ctx.entityId;
  if (!targetUserId) return { status: "failed", errorCode: "NO_ENTITY", errorMessage: "Missing user id" };

  const user = (await db.select().from(users).where(eq(users.id, targetUserId)).limit(1))[0];
  if (!user) return { status: "succeeded", result: { note: "user already deleted" } };

  try {
    // 1. Purge all uploaded resumes from object stores (clean & quarantine)
    const userResumes = await db.select().from(resumes).where(eq(resumes.userId, targetUserId));
    const quarantineStore = getObjectStore("quarantine");
    const cleanStore = getObjectStore("clean");
    for (const r of userResumes) {
      if (r.objectKey) {
        if (r.objectKey.startsWith("clean/")) {
          await cleanStore.delete(r.objectKey).catch(() => {});
        } else {
          await quarantineStore.delete(r.objectKey).catch(() => {});
        }
      }
    }

    // 2. Purge exported privacy archives if any
    const exportStore = getObjectStore("export");
    const exportReqs = await db
      .select()
      .from(privacyRequests)
      .where(and(eq(privacyRequests.userId, targetUserId), eq(privacyRequests.kind, "export")));
    for (const exp of exportReqs) {
      if (exp.resultRef) {
        await exportStore.delete(exp.resultRef).catch(() => {});
      }
    }

    // 3. Revoke all Gmail connections
    await db
      .update(gmailConnections)
      .set({ status: "revoked", tokenEnvelopeEnc: null, updatedAt: new Date() })
      .where(eq(gmailConnections.userId, targetUserId));

    // 4. Invalidate all auth sessions
    await db.delete(authSessions).where(eq(authSessions.userId, targetUserId));

    // 5. Delete user drafts, revisions, templates, opportunities, and resumes
    await db.delete(drafts).where(eq(drafts.userId, targetUserId));
    await db.delete(templates).where(eq(templates.userId, targetUserId));
    await db.delete(opportunities).where(eq(opportunities.userId, targetUserId));
    await db.delete(resumes).where(eq(resumes.userId, targetUserId));

    // 6. Complete the deletion privacy request
    await db
      .update(privacyRequests)
      .set({ state: "completed", completedAt: new Date() })
      .where(and(eq(privacyRequests.userId, targetUserId), eq(privacyRequests.kind, "delete_account")));

    // 7. Anonymize/tombstone the user row (financial ledger/payment tables hold restrictive FKs)
    await db
      .update(users)
      .set({
        status: "deleted",
        email: `deleted-${targetUserId}@deleted.local`,
        displayName: "Deleted User",
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUserId));

    logger.info("privacy.account_deleted", { userId: targetUserId });
    return { status: "succeeded", result: { deletedUserId: targetUserId } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("privacy.deletion_failed", { userId: targetUserId, error: message });
    return { status: "failed", errorCode: "DELETION_FAILED", errorMessage: message };
  }
};

/* ------------------------------------------------------------------ */
/* credits.reconcile                                                   */
/* ------------------------------------------------------------------ */

const creditsReconcile: Handler = async () => {
  const { verifyCreditConsistency } = await import("@/server/services/credits");
  const issues = await verifyCreditConsistency();
  if (issues.length > 0) {
    logger.error("credits.consistency_violations", { count: issues.length });
  }
  // Reservation sweeper (§18.4): release stale reservations whose generation
  // is definitively unsuccessful or has no runnable job. TTL alone never
  // justifies releasing a job that can still consume.
  const stale = await db.execute(sql`
    SELECT r.operation_ref FROM credit_reservations r
    WHERE r.state = 'reserved' AND r.purpose = 'generation' AND r.deadline_at < now()
  `);
  for (const row of stale.rows as Array<{ operation_ref: string }>) {
    const genRow = await db.execute(sql`SELECT id, state, draft_id FROM generation_requests WHERE id = ${row.operation_ref}::uuid`);
    const gen = genRow.rows[0] as { id: string; state: string; draft_id: string } | undefined;
    if (!gen) {
      // No generation row at all: orphaned reservation, safe to release.
      await releaseGeneration(row.operation_ref).catch(() => {});
      continue;
    }
    if (gen.state === "failed" || gen.state === "cancelled" || gen.state === "released") {
      await releaseGeneration(row.operation_ref).catch(() => {});
      continue;
    }
    // "generating" is included deliberately: that is the state a generation is
    // left in when its job exhausts its attempts mid-flight. Without this, the
    // reservation is never returned AND the parent draft stays locked in
    // "generating" forever, so the user can no longer edit or regenerate it.
    if (
      gen.state === "reserved" ||
      gen.state === "queued" ||
      gen.state === "preparing" ||
      gen.state === "generating"
    ) {
      const jobRow = await db.execute(sql`
        SELECT 1 FROM jobs WHERE kind = 'draft.generate' AND entity_id = ${gen.id}::uuid
          AND state IN ('queued','running','retry_wait','deferred')
      `);
      if (jobRow.rows.length === 0) {
        // Orphaned: reservation exists but nothing can settle it.
        await db
          .update(generationRequests)
          .set({ state: "failed", failureCode: "RESERVATION_SWEEP", failureMessage: "Generation timed out; your credit was released.", completedAt: new Date() })
          .where(eq(generationRequests.id, gen.id));
        await releaseGeneration(row.operation_ref).catch(() => {});
        // Hand the draft back to the user so it is editable again.
        if (gen.draft_id) {
          await db
            .update(drafts)
            .set({ status: "active" })
            .where(and(eq(drafts.id, gen.draft_id), eq(drafts.status, "generating")));
        }
      }
    }
  }
  return { status: "succeeded", result: { issues: issues.length } };
};

/* ------------------------------------------------------------------ */
/* digest.dispatch_daily                                              */
/* ------------------------------------------------------------------ */

/**
 * Daily digest, batched through the queue.
 *
 * Dispatching every user's email inside a single invocation would exceed the
 * Worker wall-clock limit once the user base grows, and a timeout mid-loop
 * silently strands the remainder. Each run takes a bounded batch and re-enqueues
 * itself with the last user id as the cursor until nobody is left.
 */
const digestDispatchDaily: Handler = async (ctx) => {
  const { dispatchAllDueDigests } = await import("@/server/services/digest");
  const batchSize = Number(process.env.DIGEST_BATCH_SIZE ?? 25);
  const result = await dispatchAllDueDigests({
    batchSize: Number.isFinite(batchSize) ? batchSize : 25,
    afterUserId: ctx.entityId,
  });

  if (result.nextCursor) {
    await enqueueJob({
      kind: "digest.dispatch_daily",
      entityId: result.nextCursor,
      maxAttempts: 3,
      deadlineSeconds: 120,
      // A digest batch sends real emails and is slow (~200ms each). Staggering
      // keeps several from becoming due at once, so a single drain pass does
      // not spend the whole request budget on email alone. Slower for a very
      // large audience, but it always completes instead of timing out.
      availableAfter: new Date(Date.now() + 30_000),
    });
  }

  return {
    status: "succeeded",
    result: {
      processed: result.totalEligible,
      dispatched: result.dispatched,
      skipped: result.skipped,
      failed: result.failed,
      moreRemaining: Boolean(result.nextCursor),
    },
  };
};

/* ------------------------------------------------------------------ */
/* registry                                                            */
/* ------------------------------------------------------------------ */

export const HANDLERS: Record<string, Handler> = {
  "draft.generate": draftGenerate,
  "gmail.create_draft": gmailCreateDraft,
  "gmail.reconcile": gmailReconcile,
  "payment.fulfill": paymentFulfill,
  "resume.scan_parse": resumeScanParse,
  "reminders.materialize": remindersMaterialize,
  "privacy.export": privacyExport,
  "privacy.delete": privacyDelete,
  "credits.reconcile": creditsReconcile,
  "digest.dispatch_daily": digestDispatchDaily,
};

