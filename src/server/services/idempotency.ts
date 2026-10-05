import "server-only";
import { createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db/client";
import { idempotencyRecords } from "@/db/schema";
import { sql } from "drizzle-orm";

/**
 * Durable API idempotency (§18.5). Same key + same input returns the stored
 * operation reference; same key + different input is a 409 conflict.
 */
export type IdempotencyOutcome<T> =
  | { kind: "new"; operationRef: string; result: T }
  | { kind: "replay"; operationRef: string; responseMeta: T | null }
  | { kind: "conflict" };

export async function withIdempotency<T>(params: {
  actorId: string;
  scope: string;
  key: string;
  requestHash: string;
  run: (operationRef: string) => Promise<T>;
  responseRetentionDays?: number;
}): Promise<IdempotencyOutcome<T>> {
  const existing = await db
    .select()
    .from(idempotencyRecords)
    .where(
      and(
        eq(idempotencyRecords.actorId, params.actorId),
        eq(idempotencyRecords.scope, params.scope),
        eq(idempotencyRecords.key, params.key),
        gt(idempotencyRecords.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    const record = existing[0]!;
    if (record.requestHash !== params.requestHash) return { kind: "conflict" };
    return {
      kind: "replay",
      operationRef: record.operationRef ?? record.id,
      responseMeta: (record.responseMeta as T) ?? null,
    };
  }

  const operationRef = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + (params.responseRetentionDays ?? 7) * 24 * 3600 * 1000);

  // Atomically claim the idempotency slot before running side-effects
  const claimed = await db
    .insert(idempotencyRecords)
    .values({
      actorId: params.actorId,
      scope: params.scope,
      key: params.key,
      requestHash: params.requestHash,
      operationRef,
      responseMeta: null,
      expiresAt,
    })
    .onConflictDoNothing()
    .returning();

  if (claimed.length === 0) {
    // Another concurrent request claimed this slot first; re-fetch its record
    const concurrent = (
      await db
        .select()
        .from(idempotencyRecords)
        .where(
          and(
            eq(idempotencyRecords.actorId, params.actorId),
            eq(idempotencyRecords.scope, params.scope),
            eq(idempotencyRecords.key, params.key),
          ),
        )
        .limit(1)
    )[0];

    if (!concurrent) {
      return withIdempotency(params);
    }
    if (concurrent.requestHash !== params.requestHash) {
      return { kind: "conflict" };
    }
    return {
      kind: "replay",
      operationRef: concurrent.operationRef ?? concurrent.id,
      responseMeta: (concurrent.responseMeta as T) ?? null,
    };
  }

  try {
    const result = await params.run(operationRef);
    const responseMeta = result as unknown as Record<string, unknown>;
    await db
      .update(idempotencyRecords)
      .set({ responseMeta })
      .where(eq(idempotencyRecords.id, claimed[0]!.id));
    return { kind: "new", operationRef, result };
  } catch (err) {
    // The operation failed before any durable effect; release the claim so caller can retry
    await db.delete(idempotencyRecords).where(eq(idempotencyRecords.id, claimed[0]!.id)).catch(() => {});
    throw err;
  }
}

export function hashRequest(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload, sortedKeys)).digest("hex");
}

function sortedKeys(key: string, value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)),
    );
  }
  return value;
}

export async function findIdempotentOperation(params: {
  actorId: string;
  scope: string;
  key: string;
  requestHash: string;
}): Promise<{ operationRef: string; conflict: boolean } | null> {
  const rows = await db.execute(sql`
    SELECT operation_ref, request_hash FROM idempotency_records
    WHERE actor_id = ${params.actorId}::uuid AND scope = ${params.scope} AND key = ${params.key}
      AND expires_at > now()
  `);
  const row = rows.rows[0] as { operation_ref: string | null; request_hash: string } | undefined;
  if (!row) return null;
  return { operationRef: row.operation_ref ?? "", conflict: row.request_hash !== params.requestHash };
}
