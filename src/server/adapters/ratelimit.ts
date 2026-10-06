import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { getConfig } from "@/server/config";
import { logger } from "@/server/logger";

/**
 * Rate limiting and durable quota admission (§22).
 *
 * - Expensive/sensitive mutations use the durable Postgres admission function
 *   (`admit_operation`), which is the cross-replica authority.
 * - When Upstash is configured, a fast pre-check reduces database load; its
 *   timeout behavior is fail-closed for sensitive operations (§22.3).
 */

export type LimitPolicy = {
  operationKind: string;
  /** Window in seconds (e.g. 60 for per-minute). */
  windowSeconds: number;
  limit: number;
  /** Fail closed on limiter errors (sensitive mutations). */
  failClosed: boolean;
};

export const LIMITS = {
  reveal: { operationKind: "reveal", windowSeconds: 60, limit: 20, failClosed: true },
  // A "bounced" report grants a replacement credit and invalidates a shared
  // directory contact. Without a durable per-user budget, reveal -> report ->
  // free repeat turns every contact in the directory into a free reveal.
  contactReplacement: { operationKind: "contact.replacement", windowSeconds: 86400, limit: 3, failClosed: true },
  contactReport: { operationKind: "contact.report", windowSeconds: 3600, limit: 10, failClosed: true },
  aiGenerate: { operationKind: "ai.generate", windowSeconds: 60, limit: 5, failClosed: true },
  aiGenerateHour: { operationKind: "ai.generate.hour", windowSeconds: 3600, limit: 30, failClosed: true },
  // One copilot credit buys one draft, so this is also a hard ceiling of ten
  // drafts per rolling 24 hours regardless of how many credits are held. It
  // bounds provider spend and keeps a runaway client from draining a balance.
  aiGenerateDaily: { operationKind: "ai.generate.daily", windowSeconds: 86400, limit: 10, failClosed: true },
  gmailCreate: { operationKind: "gmail.create", windowSeconds: 60, limit: 5, failClosed: true },
  gmailCreateDaily: { operationKind: "gmail.create.daily", windowSeconds: 86400, limit: 15, failClosed: true },
  gmailReconcile: { operationKind: "gmail.reconcile", windowSeconds: 60, limit: 3, failClosed: false },
  uploadIntent: { operationKind: "upload.intent", windowSeconds: 600, limit: 3, failClosed: true },
  autosave: { operationKind: "draft.autosave", windowSeconds: 60, limit: 120, failClosed: false },
  orders: { operationKind: "billing.order", windowSeconds: 600, limit: 5, failClosed: true },
  publicSupport: { operationKind: "public.support", windowSeconds: 3600, limit: 3, failClosed: false },
  digestTest: { operationKind: "digest.test", windowSeconds: 3600, limit: 3, failClosed: true },
  oauthStart: { operationKind: "oauth.start", windowSeconds: 600, limit: 5, failClosed: true },
  exportData: { operationKind: "privacy.export", windowSeconds: 86400, limit: 1, failClosed: true },
  deleteAccount: { operationKind: "privacy.delete", windowSeconds: 86400, limit: 3, failClosed: true },
  adminSensitive: { operationKind: "admin.sensitive", windowSeconds: 60, limit: 5, failClosed: true },
} satisfies Record<string, LimitPolicy>;

export type AdmissionResult = { admitted: boolean; retryAfterSeconds?: number };

function windowStart(windowSeconds: number): Date {
  const now = Math.floor(Date.now() / 1000);
  const start = Math.floor(now / windowSeconds) * windowSeconds;
  return new Date(start * 1000);
}

export async function admitOperation(params: {
  policy: LimitPolicy;
  principal: string;
  operationRef: string;
}): Promise<AdmissionResult> {
  const config = getConfig();
  try {
    const rows = await db.execute(sql`
      SELECT admit_operation(
        ${config.APP_ENV},
        ${params.policy.operationKind},
        ${params.principal},
        ${params.operationRef},
        ${params.policy.limit},
        ${windowStart(params.policy.windowSeconds).toISOString()}::timestamptz
      ) AS admitted
    `);
    const admitted = Boolean((rows.rows[0] as { admitted: boolean }).admitted);
    return { admitted, retryAfterSeconds: admitted ? undefined : params.policy.windowSeconds };
  } catch (err) {
    logger.error("admit_operation_failed", { operationKind: params.policy.operationKind, error: String(err) });
    if (params.policy.failClosed) {
      return { admitted: false, retryAfterSeconds: 30 };
    }
    return { admitted: true };
  }
}

/** Optional Upstash fast pre-check. Never the authority (§6.3). */
async function upstashPreCheck(key: string, limit: number, windowSeconds: number): Promise<boolean | null> {
  const config = getConfig();
  if (!config.UPSTASH_REDIS_REST_URL || !config.UPSTASH_REDIS_REST_TOKEN) return null;
  try {
    const res = await fetch(
      `${config.UPSTASH_REDIS_REST_URL}/pipeline/incr/${encodeURIComponent(key)}/expire/${encodeURIComponent(key)}/${windowSeconds}`,
      {
        headers: { Authorization: `Bearer ${config.UPSTASH_REDIS_REST_TOKEN}` },
        signal: AbortSignal.timeout(1_500),
      },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as Array<{ result: number } | { error: string }>;
    const count = body[0] && "result" in body[0] ? body[0].result : null;
    if (count === null) return null;
    return count <= limit;
  } catch {
    return null; // timeout/absence: defer to the durable authority
  }
}

export async function admitWithPreCheck(params: {
  policy: LimitPolicy;
  principal: string;
  operationRef: string;
}): Promise<AdmissionResult> {
  // Only a fail-closed policy ever acts on the pre-check answer (a `false`
  // below denies). For the others the REST round trip — measured at 42-456 ms
  // here, 57 ms of every directory search — had its result discarded while the
  // durable `admit_operation` ran anyway, so it was pure latency: skip it.
  const pre = params.policy.failClosed
    ? await upstashPreCheck(
        `ab:${getConfig().APP_ENV}:${params.policy.operationKind}:${params.principal}`,
        params.policy.limit,
        params.policy.windowSeconds,
      )
    : null;
  if (pre === false && params.policy.failClosed) {
    return { admitted: false, retryAfterSeconds: params.policy.windowSeconds };
  }
  return admitOperation(params);
}

