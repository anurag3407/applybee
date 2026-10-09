import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  draftRevisions,
  drafts,
  generationRequests,
  templates,
  gmailDeliveries,
} from "@/db/schema";
import { draftPatchSchema, findUnknownTemplateVariables } from "@/lib/validation";
import { describeProfileRevision, getGroundingClaims } from "@/server/services/generations";
import { sha256Hex } from "@/server/crypto";
import { admitWithPreCheck, LIMITS } from "@/server/adapters/ratelimit";
import { buildMimeMessage, validateEmailAddress } from "@/server/adapters/mime";
import { acceptGeneratedProposal, CreditError } from "@/server/services/credits";
import { audit } from "@/server/services/audit";
import { decryptEnvelope } from "@/server/crypto";
import { logger } from "@/server/logger";
import { companies, contacts, contactUnlockss } from "@/db/schema";

/**
 * Draft service (§13). One editor and domain model across manual, quick AI,
 * and agentic modes. Revisions are immutable; autosave is version-checked.
 */

export type RecipientInput =
  | { kind: "directory"; contactId: string }
  | { kind: "own"; email: string; name?: string };

export async function createDraft(params: {
  userId: string;
  mode: "manual" | "quick_ai" | "agentic";
  intent: string;
  recipient?: RecipientInput;
  subject?: string;
  body?: string;
}): Promise<string> {
  let contactId: string | null = null;
  let ownRecipientEmail: string | null = null;
  let ownRecipientName: string | null = null;
  let recipientSnapshot: Record<string, unknown> | null = null;

  if (params.recipient?.kind === "directory") {
    // Recipient must exist and be visible; the reveal is a separate explicit
    // action — no hidden credit charge from drafting (§4.2).
    contactId = params.recipient.contactId;
    const rows = await db
      .select({ name: contacts.name, title: contacts.title, companyName: companies.name })
      .from(contacts)
      .innerJoin(companies, eq(companies.id, contacts.companyId))
      .where(eq(contacts.id, contactId))
      .limit(1);
    if (rows.length === 0) throw new Error("CONTACT_NOT_FOUND");
    recipientSnapshot = { name: rows[0]!.name, title: rows[0]!.title, companyName: rows[0]!.companyName };
  } else if (params.recipient?.kind === "own") {
    ownRecipientEmail = params.recipient.email;
    ownRecipientName = params.recipient.name ?? null;
    recipientSnapshot = { name: params.recipient.name ?? null, email: params.recipient.email };
  }

  const draft = (
    await db
      .insert(drafts)
      .values({
        userId: params.userId,
        mode: params.mode,
        intent: params.intent as "intro",
        contactId,
        ownRecipientEmail,
        ownRecipientName,
      })
      .returning({ id: drafts.id })
  )[0]!;

  await db.insert(draftRevisions).values({
    draftId: draft.id,
    userId: params.userId,
    revisionNo: 1,
    subject: params.subject ?? "",
    body: params.body ?? "",
    recipientSnapshot,
  });
  await db
    .update(drafts)
    .set({ currentRevisionId: null, currentVersion: 1, listSubject: params.subject ?? "" })
    .where(eq(drafts.id, draft.id));
  return draft.id;
}

/**
 * A retired key version or a corrupt envelope used to throw out of the draft
 * read, which 500ed both the editor page and the `.eml` download for that user.
 * The address is simply unavailable until it can be re-read; everything else
 * about the draft still renders.
 */
function decryptContactEmail(emailEnc: string | null, contactId: string): string | null {
  if (!emailEnc) return null;
  try {
    return decryptEnvelope(emailEnc, `contact:${contactId}`);
  } catch {
    logger.warn("contact.email_undecryptable", { contactId });
    return null;
  }
}

export async function getDraftForUser(userId: string, draftId: string) {
  const draft = (
    await db.select().from(drafts).where(and(eq(drafts.id, draftId), eq(drafts.userId, userId))).limit(1)
  )[0];
  if (!draft) return null;

  const revisionRows = await db
    .select()
    .from(draftRevisions)
    .where(eq(draftRevisions.draftId, draftId))
    .orderBy(desc(draftRevisions.revisionNo));
  const current = revisionRows.find((r) => r.revisionNo === draft.currentVersion) ?? revisionRows[0];

  let recipient: {
    kind: "directory" | "own";
    contactId?: string;
    name?: string | null;
    title?: string | null;
    companyName?: string | null;
    email?: string | null;
    unlocked?: boolean;
  } | null = null;
  if (draft.contactId) {
    const rows = await db
      .select({ name: contacts.name, title: contacts.title, companyName: companies.name, emailEnc: contacts.emailEnc })
      .from(contacts)
      .innerJoin(companies, eq(companies.id, contacts.companyId))
      .where(eq(contacts.id, draft.contactId))
      .limit(1);
    const unlock = await db
      .select({ id: contactUnlockss.id })
      .from(contactUnlockss)
      .where(and(eq(contactUnlockss.userId, userId), eq(contactUnlockss.contactId, draft.contactId)))
      .limit(1);
    recipient = {
      kind: "directory",
      contactId: draft.contactId,
      name: rows[0]?.name ?? null,
      title: rows[0]?.title ?? null,
      companyName: rows[0]?.companyName ?? null,
      email: unlock.length > 0 && rows[0]?.emailEnc ? decryptContactEmail(rows[0].emailEnc, draft.contactId) : null,
      unlocked: unlock.length > 0,
    };
  } else if (draft.ownRecipientEmail) {
    recipient = { kind: "own", name: draft.ownRecipientName, email: draft.ownRecipientEmail, unlocked: true };
  }

  const latestGeneration = (
    await db
      .select()
      .from(generationRequests)
      .where(eq(generationRequests.draftId, draftId))
      .orderBy(desc(generationRequests.createdAt))
      .limit(1)
  )[0];
  const latestDelivery = (
    await db
      .select()
      .from(gmailDeliveries)
      .where(eq(gmailDeliveries.draftId, draftId))
      .orderBy(desc(gmailDeliveries.createdAt))
      .limit(1)
  )[0];

  // A proposal the user has neither accepted nor dismissed has to survive a
  // reload. The composer renders Apply/Dismiss from the generation state alone,
  // so without the text they would be approving an email they cannot read.
  // The row is already in `revisionRows` — no second query.
  const pendingProposal =
    latestGeneration && latestGeneration.state === "ready" && latestGeneration.acceptanceState === "pending"
      ? revisionRows.find((r) => r.id === latestGeneration.proposedRevisionId) ?? null
      : null;
  const pendingClaims = pendingProposal ? await getGroundingClaims(pendingProposal.id) : [];

  return {
    draft,
    currentRevision: current ?? null,
    revisionCount: revisionRows.length,
    recipient,
    latestGeneration: latestGeneration ?? null,
    pendingProposal: pendingProposal
      ? {
          subject: pendingProposal.subject,
          body: pendingProposal.body,
          claims: pendingClaims,
          profileRevision: await describeProfileRevision(pendingProposal.profileRevisionId),
        }
      : null,
    latestDelivery: latestDelivery ?? null,
  };
}

export async function listDrafts(userId: string, status?: string) {
  const where = status
    ? and(eq(drafts.userId, userId), eq(drafts.status, status as "active"))
    : eq(drafts.userId, userId);
  return db
    .select({
      id: drafts.id,
      mode: drafts.mode,
      intent: drafts.intent,
      subject: drafts.listSubject,
      status: drafts.status,
      version: drafts.currentVersion,
      updatedAt: drafts.updatedAt,
      contactId: drafts.contactId,
      ownRecipientEmail: drafts.ownRecipientEmail,
    })
    .from(drafts)
    .where(where)
    .orderBy(desc(drafts.updatedAt))
    .limit(50);
}

/** Version conflict between an expected draft version and the stored one. */
class DraftConflictError extends Error {
  constructor() {
    super("VERSION_CONFLICT");
  }
}

export type DraftRecipientPatch =
  | { kind: "directory"; contactId: string }
  | { kind: "own"; email: string; name?: string | null }
  | { kind: "none" };

export async function autosaveDraft(params: {
  userId: string;
  draftId: string;
  expectedVersion: number;
  subject?: string;
  body?: string;
  intent?: string;
  mode?: string;
  recipient?: DraftRecipientPatch;
}): Promise<{ version: number }> {
  const admission = await admitWithPreCheck({
    policy: LIMITS.autosave,
    principal: params.userId,
    operationRef: `autosave:${params.userId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
  });
  if (!admission.admitted) throw new DraftConflictError();

  return db.transaction(async (tx) => {
    const draft = (
      await tx
        .select()
        .from(drafts)
        .where(and(eq(drafts.id, params.draftId), eq(drafts.userId, params.userId)))
        .limit(1)
    )[0];
    if (!draft) throw new Error("DRAFT_NOT_FOUND");
    if (draft.status === "deleting" || draft.status === "deleted") throw new Error("DRAFT_DELETED");
    if (draft.currentVersion !== params.expectedVersion) throw new DraftConflictError();

    const existing = (
      await tx
        .select()
        .from(draftRevisions)
        .where(and(eq(draftRevisions.draftId, draft.id), eq(draftRevisions.revisionNo, draft.currentVersion)))
        .limit(1)
    )[0];
    const subject = params.subject ?? existing?.subject ?? "";
    const body = params.body ?? existing?.body ?? "";

    // Autosave updates the current revision in place; explicit generation and
    // delivery flows create immutable revisions.
    await tx
      .update(draftRevisions)
      .set({ subject, body, contentHash: sha256Hex(`${subject}\n${body}`).slice(0, 32) })
      .where(and(eq(draftRevisions.draftId, draft.id), eq(draftRevisions.revisionNo, draft.currentVersion)));
    await tx
      .update(drafts)
      .set({
        updatedAt: new Date(),
        listSubject: subject,
        ...(params.intent ? { intent: params.intent as "intro" } : {}),
        ...(params.mode ? { mode: params.mode as "manual" } : {}),
        ...(await recipientColumns(params.recipient)),
      })
      .where(eq(drafts.id, draft.id));
    return { version: draft.currentVersion };
  });
}

/**
 * Recipient columns to merge into the draft update.
 *
 * The composer could not set a recipient at all: draftPatchSchema accepted one,
 * the PATCH route dropped it, and a draft created from the dashboard's "Create
 * an introduction" button had none — leaving the primary call to action unable
 * to generate anything. Setting one kind clears the other so a draft never
 * carries a stale directory id alongside a manual address.
 */
async function recipientColumns(
  recipient: DraftRecipientPatch | undefined,
): Promise<Partial<{ contactId: string | null; ownRecipientEmail: string | null; ownRecipientName: string | null }>> {
  if (!recipient) return {};
  if (recipient.kind === "none") {
    return { contactId: null, ownRecipientEmail: null, ownRecipientName: null };
  }
  if (recipient.kind === "directory") {
    // Verified outside the caller's transaction so this helper needs no
    // transaction type; a directory contact disappearing mid-save is not a
    // realistic race.
    const contact = (await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.id, recipient.contactId)).limit(1))[0];
    if (!contact) throw new Error("CONTACT_NOT_FOUND");
    return { contactId: contact.id, ownRecipientEmail: null, ownRecipientName: null };
  }
  return {
    contactId: null,
    ownRecipientEmail: recipient.email.trim().toLowerCase(),
    ownRecipientName: recipient.name?.trim() || null,
  };
}

export async function deleteDraft(userId: string, draftId: string): Promise<void> {
  await db
    .update(drafts)
    .set({ status: "deleted", updatedAt: new Date() })
    .where(and(eq(drafts.id, draftId), eq(drafts.userId, userId)));
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export async function listTemplates(userId: string) {
  return db.select().from(templates).where(eq(templates.userId, userId)).orderBy(desc(templates.updatedAt));
}

export async function createTemplate(userId: string, input: { name: string; subject: string; body: string }) {
  const unknownVars = findUnknownTemplateVariables(input.body, input.subject);
  const inserted = await db
    .insert(templates)
    .values({ userId, name: input.name, subject: input.subject, body: input.body, variables: [] })
    .returning({ id: templates.id });
  return { id: inserted[0]!.id, unknownVars };
}

export async function updateTemplate(userId: string, templateId: string, input: { name?: string; subject?: string; body?: string }, expectedVersion: number) {
  const existing = (
    await db.select().from(templates).where(and(eq(templates.id, templateId), eq(templates.userId, userId))).limit(1)
  )[0];
  if (!existing) throw new Error("TEMPLATE_NOT_FOUND");
  if (existing.version !== expectedVersion) throw new DraftConflictError();
  await db
    .update(templates)
    .set({
      name: input.name ?? existing.name,
      subject: input.subject ?? existing.subject,
      body: input.body ?? existing.body,
      version: existing.version + 1,
      updatedAt: new Date(),
    })
    .where(eq(templates.id, templateId));
}

export async function deleteTemplate(userId: string, templateId: string) {
  await db.delete(templates).where(and(eq(templates.id, templateId), eq(templates.userId, userId)));
}

/* ------------------------------------------------------------------ */
/* Proposal acceptance + export                                        */
/* ------------------------------------------------------------------ */

export async function acceptProposal(params: { userId: string; generationId: string; expectedVersion: number }) {
  const result = await acceptGeneratedProposal({
    generationId: params.generationId,
    userId: params.userId,
    expectedVersion: params.expectedVersion,
  });
  await audit({
    actorType: "user",
    actorId: params.userId,
    action: "draft.proposal_accepted",
    entityType: "generation",
    entityId: params.generationId,
  });
  return result;
}

export async function dismissProposal(userId: string, generationId: string): Promise<void> {
  await db
    .update(generationRequests)
    .set({ acceptanceState: "dismissed" })
    .where(and(eq(generationRequests.id, generationId), eq(generationRequests.userId, userId), eq(generationRequests.acceptanceState, "pending")));
}

export async function exportEml(
  userId: string,
  draftId: string,
): Promise<{ filename: string; content: string; status: string } | null> {
  const data = await getDraftForUser(userId, draftId);
  if (!data || !data.currentRevision) return null;
  const rawToEmail = data.recipient?.email;
  const toEmail =
    rawToEmail && validateEmailAddress(rawToEmail).ok
      ? rawToEmail
      : "undisclosed-recipient@reachbee.local";
  const mime = buildMimeMessage({
    fromEmail: "draft@reachbee.local",
    fromName: "ReachBee export (not sent)",
    toEmail,
    toName: data.recipient?.name ?? null,
    subject: data.currentRevision.subject || "(no subject)",
    body: data.currentRevision.body,
    attachment: null,
    operationMarker: `export-${draftId.replace(/-/g, "").slice(0, 20)}`,
  });
  // Never expose private object URLs in the export (§13.2). Attachments are
  // delivered only through the approved Gmail path, not .eml export.
  return { filename: `reachbee-draft-${draftId.slice(0, 8)}.eml`, content: mime.raw, status: data.draft.status };
}

export { CreditError };
