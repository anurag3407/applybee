import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

/**
 * Transactional credits service (§18). All mutations run as audited SQL
 * functions in one database transaction — never read/write sequences over
 * HTTP, never Redis balances, never browser callbacks as source of truth.
 */

export type CreditType = "contact" | "ai";

export class CreditError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function mapDbError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("INSUFFICIENT_CONTACT_CREDITS")) {
    throw new CreditError("INSUFFICIENT_CONTACT_CREDITS", "You need one contact reveal credit to continue.");
  }
  if (message.includes("INSUFFICIENT_AI_CREDITS")) {
    throw new CreditError("INSUFFICIENT_AI_CREDITS", "You need one AI generation credit to continue.");
  }
  if (message.includes("CONTACT_NOT_FOUND")) {
    throw new CreditError("CONTACT_NOT_FOUND", "This contact is no longer in the directory.");
  }
  if (message.includes("CONTACT_UNAVAILABLE")) {
    throw new CreditError("CONTACT_UNAVAILABLE", "This contact is unavailable for new reveals.");
  }
  if (message.includes("CONTACT_INVALID")) {
    throw new CreditError("CONTACT_INVALID", "We couldn't verify this contact's email. No reveal credit was used.");
  }
  if (message.includes("ACCOUNT_DELETED")) {
    throw new CreditError("ACCOUNT_DELETED", "This account is closed.");
  }
  if (message.includes("RESERVATION_STATE_INVALID")) {
    throw new CreditError("RESERVATION_STATE_INVALID", "This reservation already settled.");
  }
  if (message.includes("LOT_ALLOCATION_SHORTFALL")) {
    throw new CreditError("LOT_ALLOCATION_SHORTFALL", "Credit lots could not cover this operation.");
  }
  throw err;
}

export async function revealContact(params: {
  userId: string;
  contactId: string;
  operationRef: string;
  actor?: string;
}): Promise<{ unlockId: string; alreadyUnlocked: boolean; charged: boolean }> {
  try {
    const result = await db.transaction(async (tx) => {
      const res = await tx.execute(sql`
        SELECT reveal_contact(${params.userId}::uuid, ${params.contactId}::uuid, ${params.operationRef}, ${params.actor ?? "user"}) AS out
      `);
      return (res.rows[0] as { out: { unlock_id: string; already_unlocked: boolean; charged: boolean } }).out;
    });
    return {
      unlockId: result.unlock_id,
      alreadyUnlocked: result.already_unlocked,
      charged: result.charged,
    };
  } catch (err) {
    mapDbError(err);
  }
}

export async function releaseGeneration(operationRef: string): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT release_generation(${operationRef})`);
    });
  } catch (err) {
    mapDbError(err);
  }
}

export async function fulfillCapturedPayment(params: {
  providerPaymentId: string;
  providerOrderId: string;
  amountPaise: number;
  currency: string;
}): Promise<{ granted: boolean; alreadyGranted: boolean; paymentId: string }> {
  try {
    const result = await db.transaction(async (tx) => {
      const res = await tx.execute(sql`
        SELECT fulfill_captured_payment(
          ${params.providerPaymentId}, ${params.providerOrderId},
          ${params.amountPaise}, ${params.currency}
        ) AS out
      `);
      return (res.rows[0] as { out: { granted: boolean; already_granted: boolean; payment_id: string } }).out;
    });
    return { granted: result.granted, alreadyGranted: result.already_granted, paymentId: result.payment_id };
  } catch (err) {
    mapDbError(err);
  }
}

export async function getBalances(userId: string): Promise<{
  contact: { available: number; reserved: number };
  ai: { available: number; reserved: number };
}> {
  const rows = await db.execute(sql`
    SELECT type, available, reserved FROM credit_accounts WHERE user_id = ${userId}::uuid
  `);
  const out = {
    contact: { available: 0, reserved: 0 },
    ai: { available: 0, reserved: 0 },
  };
  for (const row of rows.rows as Array<{ type: string; available: number; reserved: number }>) {
    if (row.type === "contact") out.contact = { available: row.available, reserved: row.reserved };
    if (row.type === "ai") out.ai = { available: row.available, reserved: row.reserved };
  }
  return out;
}

export async function getLedger(userId: string, type: CreditType | "all", limit = 50, offset = 0) {
  const rows = await db.execute(sql`
    SELECT id, type, kind, available_delta, reserved_delta, reason, operation_ref, created_at
    FROM credit_ledger_entries
    WHERE user_id = ${userId}::uuid
      AND (${type === "all" ? sql`true` : sql`type = ${type}`})
    ORDER BY created_at DESC, id DESC
    LIMIT ${limit} OFFSET ${offset}
  `);
  return rows.rows as Array<{
    id: string;
    type: string;
    kind: string;
    available_delta: number;
    reserved_delta: number;
    reason: string | null;
    operation_ref: string | null;
    created_at: string;
  }>;
}

/** Invariant check used by tests and the daily credits.reconcile job. */
export async function verifyCreditConsistency(userId?: string) {
  const rows = await db.execute(sql`
    SELECT * FROM verify_credit_consistency(${userId ?? null}::uuid)
  `);
  return rows.rows as Array<{ user_id: string; type: string; issue: string }>;
}

export async function acceptGeneratedProposal(params: {
  generationId: string;
  userId: string;
  expectedVersion: number;
}): Promise<{ revisionId: string; version: number }> {
  try {
    const result = await db.transaction(async (tx) => {
      const res = await tx.execute(sql`
        SELECT accept_generated_proposal(
          ${params.generationId}::uuid, ${params.userId}::uuid, ${params.expectedVersion}
        ) AS out
      `);
      return (res.rows[0] as { out: { revision_id: string; version: number } }).out;
    });
    return { revisionId: result.revision_id, version: result.version };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("VERSION_CONFLICT")) {
      throw new CreditError("VERSION_CONFLICT", "This draft changed while you were away. Reload to review the latest version.");
    }
    if (message.includes("GENERATION_NOT_READY")) {
      throw new CreditError("GENERATION_NOT_READY", "This generation is not ready to apply.");
    }
    if (message.includes("GENERATION_ALREADY")) {
      throw new CreditError("GENERATION_ALREADY_SETTLED", "This generated draft was already handled.");
    }
    mapDbError(err);
  }
}
