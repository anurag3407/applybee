import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  draftApprovals,
  draftRevisions,
  drafts,
  gmailConnections,
  gmailDeliveries,
  oauthStates,
} from "@/db/schema";
import { getConfig } from "@/server/config";
import {
  buildAuthorizeUrl,
  buildOAuthState,
  exchangeAuthorizationCode,
  encryptTokenEnvelope,
  GMAIL_SCOPE,
} from "@/server/adapters/gmail";
import { emailFingerprint, sha256Hex, decryptEnvelope, encryptEnvelope } from "@/server/crypto";
import { admitWithPreCheck, LIMITS } from "@/server/adapters/ratelimit";
import { enqueueJob } from "@/server/services/jobs";
import { logger } from "@/server/logger";
import { audit } from "@/server/services/audit";

/**
 * Gmail service (§16). Draft-only delivery: user approval precedes creation;
 * the approval records the exact revision/mailbox/attachment snapshot.
 */

export async function getConnection(userId: string) {
  const rows = await db
    .select({
      id: gmailConnections.id,
      googleEmail: gmailConnections.googleEmail,
      googleSubject: gmailConnections.googleSubject,
      scopes: gmailConnections.scopes,
      status: gmailConnections.status,
      version: gmailConnections.version,
      createdAt: gmailConnections.createdAt,
    })
    .from(gmailConnections)
    .where(and(eq(gmailConnections.userId, userId), eq(gmailConnections.status, "active")))
    .limit(1);
  return rows[0] ?? null;
}

export async function startConnect(params: {
  userId: string;
  returnPath: string;
}): Promise<{ authorizeUrl: string } | { error: string }> {
  const config = getConfig();
  if (!config.FEATURE_GMAIL_ENABLED) {
    return { error: "Gmail connection is temporarily unavailable." };
  }
  if (!config.GOOGLE_OAUTH_CLIENT_ID || !config.GOOGLE_OAUTH_CLIENT_SECRET || !config.GOOGLE_OAUTH_REDIRECT_URI) {
    return {
      error:
        "Gmail connection is not configured in this environment. You can still write, copy, and export drafts — see Pricing and Security pages for what works without Gmail.",
    };
  }

  const admission = await admitWithPreCheck({ policy: LIMITS.oauthStart, principal: params.userId, operationRef: `oauth:${params.userId}:${Date.now()}` });
  if (!admission.admitted) return { error: "Too many connection attempts. Please wait a moment." };

  const { state, verifier } = buildOAuthState();
  const challenge = sha256Hex(verifier).slice(0, 43);
  await db.insert(oauthStates).values({
    stateHash: sha256Hex(state),
    userId: params.userId,
    nonceHash: sha256Hex(verifier),
    verifierEncrypted: null,
    returnPath: params.returnPath.startsWith("/") ? params.returnPath : "/app/settings/integrations",
    intent: "connect",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  const authorizeUrl = buildAuthorizeUrl({
    clientId: config.GOOGLE_OAUTH_CLIENT_ID,
    redirectUri: config.GOOGLE_OAUTH_REDIRECT_URI,
    state,
    challenge,
  });
  // Store the verifier encrypted alongside state (hash of verifier kept for
  // binding; the plaintext verifier is recoverable only via the envelope key).
  await db
    .update(oauthStates)
    .set({ verifierEncrypted: encryptEnvelope(JSON.stringify({ verifier }), `oauth-state:${sha256Hex(state)}`) })
    .where(sql`state_hash = ${sha256Hex(state)}`);
  return { authorizeUrl };
}

/**
 * Sandbox connection for development/demo (labeled, §27.2): only when the
 * Gmail adapter is the mock and the environment is not production. Lets the
 * approval → delivery → reconciliation flow be exercised honestly.
 */
export async function connectSandbox(userId: string): Promise<void> {
  const config = getConfig();
  if (config.gmailMode !== "mock" || config.isProduction) {
    throw new DeliveryPreflightError("SANDBOX_UNAVAILABLE", "Sandbox Gmail is only available in development.");
  }
  const email = "sandbox.mailbox@example.com";
  const binding = `gmail-connection:${userId}:${email}`;
  const envelope = encryptTokenEnvelope({ refreshToken: "mock-refresh", accessToken: "mock-access" }, binding);
  const existing = (
    await db
      .select()
      .from(gmailConnections)
      .where(and(eq(gmailConnections.userId, userId), eq(gmailConnections.googleSubject, email)))
      .limit(1)
  )[0];
  if (existing) {
    await db
      .update(gmailConnections)
      .set({ status: "active", version: existing.version + 1, tokenEnvelopeEnc: envelope, updatedAt: new Date() })
      .where(eq(gmailConnections.id, existing.id));
  } else {
    await db
      .update(gmailConnections)
      .set({ status: "revoked", updatedAt: new Date() })
      .where(and(eq(gmailConnections.userId, userId), eq(gmailConnections.status, "active")));
    await db.insert(gmailConnections).values({
      userId,
      googleSubject: email,
      googleEmail: email,
      scopes: [GMAIL_SCOPE],
      tokenEnvelopeEnc: envelope,
      accessTokenExpiresAt: new Date(Date.now() + 3600_000),
      status: "active",
    });
  }
}

export type ConnectCallbackResult = { status: "connected"; email: string } | { status: "error"; reason: string } | { status: "declined" };

export async function handleConnectCallback(params: {
  userIdFromState?: string;
  code: string | null;
  state: string | null;
  errorResponse?: string | null;
}): Promise<ConnectCallbackResult> {
  const config = getConfig();
  if (params.errorResponse) {
    return { status: params.errorResponse === "access_denied" ? "declined" : "error", reason: params.errorResponse };
  }
  if (!params.code || !params.state) return { status: "error", reason: "missing_parameters" };

  // One-time state consumption.
  const stateRow = (
    await db
      .update(oauthStates)
      .set({ consumedAt: new Date() })
      .where(and(eq(oauthStates.stateHash, sha256Hex(params.state)), sql`consumed_at IS NULL AND expires_at > now()`))
      .returning()
  )[0];
  if (!stateRow) return { status: "error", reason: "state_invalid_or_expired" };

  const userId = stateRow.userId;
  if (!config.GOOGLE_OAUTH_CLIENT_ID || !config.GOOGLE_OAUTH_CLIENT_SECRET || !config.GOOGLE_OAUTH_REDIRECT_URI) {
    return { status: "error", reason: "not_configured" };
  }

  let verifier = "";
  if (stateRow.verifierEncrypted) {
    try {
      verifier = decryptEnvelope(stateRow.verifierEncrypted, `oauth-state:${sha256Hex(params.state)}`);
    } catch {
      verifier = stateRow.nonceHash; // fallback binding (dev mode)
    }
  }

  const exchange = await exchangeAuthorizationCode({
    clientId: config.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: config.GOOGLE_OAUTH_CLIENT_SECRET,
    redirectUri: config.GOOGLE_OAUTH_REDIRECT_URI,
    code: params.code,
    verifier: verifier || stateRow.nonceHash,
  });
  if (exchange.kind === "invalid_grant") return { status: "error", reason: "invalid_grant" };
  if (exchange.kind === "error") return { status: "error", reason: exchange.code };
  if (!exchange.idTokenEmail) return { status: "error", reason: "identity_unverified" };

  // Granted-scope check: partial consent disables delivery (§16.2).
  if (!exchange.scope.includes(GMAIL_SCOPE)) {
    return { status: "error", reason: "partial_scope" };
  }

  const binding = `gmail-connection:${userId}:${exchange.idTokenEmail}`;
  const envelope = encryptTokenEnvelope({ refreshToken: exchange.refreshToken, accessToken: exchange.accessToken }, binding);
  const expiresAt = new Date(Date.now() + exchange.expiresIn * 1000);

  // Preserve an existing refresh token when Google returns none (§16.3).
  const existing = (
    await db
      .select()
      .from(gmailConnections)
      .where(and(eq(gmailConnections.userId, userId), eq(gmailConnections.googleSubject, exchange.idTokenEmail)))
      .limit(1)
  )[0];
  const finalEnvelope =
    !exchange.refreshToken && existing?.tokenEnvelopeEnc ? existing.tokenEnvelopeEnc : envelope;

  if (existing) {
    await db
      .update(gmailConnections)
      .set({
        status: "active",
        scopes: exchange.scope.split(" "),
        tokenEnvelopeEnc: finalEnvelope,
        accessTokenExpiresAt: expiresAt,
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(gmailConnections.id, existing.id));
  } else {
    // One active connection per user: retire any previous different-mailbox row.
    await db
      .update(gmailConnections)
      .set({ status: "revoked", updatedAt: new Date() })
      .where(and(eq(gmailConnections.userId, userId), eq(gmailConnections.status, "active")));
    await db.insert(gmailConnections).values({
      userId,
      googleSubject: exchange.idTokenEmail,
      googleEmail: exchange.idTokenEmail,
      scopes: exchange.scope.split(" "),
      tokenEnvelopeEnc: finalEnvelope,
      accessTokenExpiresAt: expiresAt,
      status: "active",
    });
  }

  await audit({ actorType: "user", actorId: userId, action: "gmail.connected", metadata: { scope: GMAIL_SCOPE } });
  return { status: "connected", email: exchange.idTokenEmail };
}

export async function disconnectGmail(userId: string): Promise<void> {
  const connection = (await db.select().from(gmailConnections).where(and(eq(gmailConnections.userId, userId), eq(gmailConnections.status, "active"))).limit(1))[0];
  if (!connection) return;
  // Version bump blocks in-flight approvals; queued deliveries gate on
  // connection version before dispatch (§16.3).
  await db
    .update(gmailConnections)
    .set({ status: "revoked", tokenEnvelopeEnc: null, version: connection.version + 1, updatedAt: new Date() })
    .where(eq(gmailConnections.id, connection.id));
  await db
    .update(draftApprovals)
    .set({ state: "invalidated", invalidatedAt: new Date() })
    .where(and(eq(draftApprovals.userId, userId), eq(draftApprovals.connectionId, connection.id), eq(draftApprovals.state, "active")));
  await audit({ actorType: "user", actorId: userId, action: "gmail.disconnected" });
}

/* ------------------------------------------------------------------ */
/* Approval + delivery                                                 */
/* ------------------------------------------------------------------ */

export class DeliveryPreflightError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function approveDraftDelivery(params: {
  userId: string;
  draftId: string;
  attachmentResumeId?: string | null;
}): Promise<{ approvalId: string; approvalHash: string }> {
  const config = getConfig();
  if (!config.FEATURE_GMAIL_ENABLED) {
    throw new DeliveryPreflightError("GMAIL_DISABLED", "Gmail delivery is temporarily unavailable. You can copy the draft instead.");
  }
  const connection = await getConnection(params.userId);
  if (!connection) {
    throw new DeliveryPreflightError("NOT_CONNECTED", "Connect Gmail first — or copy the draft content.");
  }

  const draft = (
    await db
      .select()
      .from(drafts)
      .where(and(eq(drafts.id, params.draftId), eq(drafts.userId, params.userId)))
      .limit(1)
  )[0];
  if (!draft) throw new DeliveryPreflightError("DRAFT_NOT_FOUND", "Draft not found.");

  const revision = (
    await db
      .select()
      .from(draftRevisions)
      .where(and(eq(draftRevisions.draftId, draft.id), eq(draftRevisions.revisionNo, draft.currentVersion)))
      .limit(1)
  )[0];
  if (!revision) throw new DeliveryPreflightError("NO_REVISION", "This draft has no content yet.");

  // Recipient resolution + fingerprint.
  let recipientEmail: string;
  if (draft.contactId) {
    const unlock = await db.execute(sql`SELECT 1 FROM contact_unlocks WHERE user_id = ${params.userId}::uuid AND contact_id = ${draft.contactId}::uuid`);
    if (unlock.rows.length === 0) {
      throw new DeliveryPreflightError("CONTACT_LOCKED", "Reveal the contact email first (1 contact credit).");
    }
    const { contacts } = await import("@/db/schema");
    const contact = (await db.select().from(contacts).where(eq(contacts.id, draft.contactId)).limit(1))[0];
    if (!contact?.emailEnc) throw new DeliveryPreflightError("NO_RECIPIENT", "This contact has no usable address.");
    recipientEmail = decryptEnvelope(contact.emailEnc, `contact:${contact.id}`);
  } else if (draft.ownRecipientEmail) {
    recipientEmail = draft.ownRecipientEmail;
  } else {
    throw new DeliveryPreflightError("NO_RECIPIENT", "Choose a recipient first.");
  }

  // Delivery-wide suppression blocks even manually entered copies (§23.3).
  const suppression = await db.execute(
    sql`SELECT 1 FROM contact_suppressions WHERE email_fingerprint = ${emailFingerprint(recipientEmail)} AND state = 'active' AND scope = 'delivery_wide'`,
  );
  if (suppression.rows.length > 0) {
    throw new DeliveryPreflightError("RECIPIENT_SUPPRESSED", "This recipient asked not to be contacted through Apply Bee.");
  }

  // Immutable approval snapshot: revision + mailbox version + attachment hash.
  const approvalHash = sha256Hex(
    JSON.stringify({
      draftId: draft.id,
      revisionId: revision.id,
      subject: revision.subject,
      body: revision.body,
      connectionId: connection.id,
      connectionVersion: connection.version,
      recipientFingerprint: emailFingerprint(recipientEmail),
      attachmentResumeId: params.attachmentResumeId ?? null,
    }),
  );
  const approval = (
    await db
      .insert(draftApprovals)
      .values({
        userId: params.userId,
        draftId: draft.id,
        revisionId: revision.id,
        connectionId: connection.id,
        connectionVersion: connection.version,
        recipientFingerprint: emailFingerprint(recipientEmail),
        attachmentResumeId: params.attachmentResumeId ?? null,
        approvalHash,
      })
      .returning({ id: draftApprovals.id })
  )[0]!;
  return { approvalId: approval.id, approvalHash };
}

export async function startDelivery(params: { userId: string; draftId: string; approvalId: string }): Promise<{ deliveryId: string }> {
  const approval = (
    await db
      .select()
      .from(draftApprovals)
      .where(and(eq(draftApprovals.id, params.approvalId), eq(draftApprovals.userId, params.userId), eq(draftApprovals.draftId, params.draftId)))
      .limit(1)
  )[0];
  if (!approval || approval.state !== "active") {
    throw new DeliveryPreflightError("APPROVAL_INVALID", "Re-review and approve the current version of this draft first.");
  }

  const admission = await admitWithPreCheck({ policy: LIMITS.gmailCreate, principal: params.userId, operationRef: `gmail:${params.userId}:${params.approvalId}` });
  if (!admission.admitted) {
    throw new DeliveryPreflightError("RATE_LIMITED", "Too many delivery requests. Please wait a moment.");
  }

  // Consume the approval and create the delivery + job atomically.
  const deliveryId = await db.transaction(async (tx) => {
    const consumed = await tx
      .update(draftApprovals)
      .set({ state: "consumed" })
      .where(and(eq(draftApprovals.id, approval.id), eq(draftApprovals.state, "active")))
      .returning({ id: draftApprovals.id });
    if (consumed.length === 0) throw new DeliveryPreflightError("APPROVAL_INVALID", "This approval was already used.");

    const delivery = (
      await tx
        .insert(gmailDeliveries)
        .values({
          userId: params.userId,
          draftId: params.draftId,
          revisionId: approval.revisionId,
          approvalId: approval.id,
          connectionId: approval.connectionId,
          connectionVersion: approval.connectionVersion,
          approvalHash: approval.approvalHash,
          operationMarker: `ab-${approval.approvalHash.slice(0, 24)}`,
          state: "queued",
        })
        .returning({ id: gmailDeliveries.id })
    )[0]!;

    await enqueueJob({ kind: "gmail.create_draft", userId: params.userId, entityId: delivery.id, maxAttempts: 2, deadlineSeconds: 120, tx });
    return delivery.id;
  });

  await audit({
    actorType: "user",
    actorId: params.userId,
    action: "gmail.delivery_queued",
    entityType: "gmail_delivery",
    entityId: deliveryId,
    metadata: { note: "Draft creation only; nothing is sent." },
  });
  return { deliveryId };
}

export async function getDeliveryStatus(userId: string, deliveryId: string) {
  const rows = await db
    .select()
    .from(gmailDeliveries)
    .where(and(eq(gmailDeliveries.id, deliveryId), eq(gmailDeliveries.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function requestReconcile(userId: string, deliveryId: string): Promise<{ scheduled: boolean }> {
  const delivery = (await db.select().from(gmailDeliveries).where(and(eq(gmailDeliveries.id, deliveryId), eq(gmailDeliveries.userId, userId))).limit(1))[0];
  if (!delivery) throw new DeliveryPreflightError("DELIVERY_NOT_FOUND", "Delivery not found.");
  if (delivery.state !== "unknown" && delivery.state !== "needs_confirmation") {
    return { scheduled: false };
  }
  const admission = await admitWithPreCheck({ policy: LIMITS.gmailReconcile, principal: userId, operationRef: `reconcile:${deliveryId}:${Date.now()}` });
  if (!admission.admitted) return { scheduled: false };
  await enqueueJob({ kind: "gmail.reconcile", userId, entityId: deliveryId, maxAttempts: 3 });
  return { scheduled: true };
}

/** Explicit user-confirmed recreate with duplicate warning (§16.5). */
export async function recreateDelivery(userId: string, draftId: string): Promise<{ deliveryId: string }> {
  const approval = await approveDraftDelivery({ userId, draftId, attachmentResumeId: null });
  return startDelivery({ userId, draftId, approvalId: approval.approvalId });
}

export async function listDeliveries(userId: string, limit = 20) {
  return db
    .select()
    .from(gmailDeliveries)
    .where(eq(gmailDeliveries.userId, userId))
    .orderBy(desc(gmailDeliveries.createdAt))
    .limit(limit);
}

export { logger };
