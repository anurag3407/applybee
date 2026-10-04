import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { getConfig } from "@/server/config";
import { logger } from "@/server/logger";
import { HANDLERS, type HandlerOutcome } from "./handlers";

/**
 * Durable worker loop (§20). At-least-once execution: every handler is
 * idempotent against its domain state; Postgres leases/fencing are the
 * authority. Queue messages are outbox events in this deployment; production
 * swaps the transport (SQS/Cloudflare Queues) without changing semantics.
 */

const WORKER_ID = `worker-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;

export async function processDueJobs(limit = 5): Promise<number> {
  const due = await db.execute(sql`
    SELECT id, kind FROM jobs
    WHERE (state IN ('queued','retry_wait','deferred') AND available_after <= now())
       OR (state = 'running' AND (lease_expires_at IS NULL OR lease_expires_at < now()))
    ORDER BY available_after ASC
    LIMIT ${limit}
  `);

  let processed = 0;
  for (const row of due.rows as Array<{ id: string; kind: string }>) {
    const claimed = await db.execute(sql`
      SELECT claim_job(${row.id}::uuid, ${WORKER_ID}, 120, 120) AS out
    `);
    const claim = (claimed.rows[0] as { out: { fencing_token: number } | null } | null)?.out;
    if (!claim) continue;
    processed++;
    try {
      const ctx = await loadContext(row.id);
      const handler = HANDLERS[row.kind];
      if (!handler) {
        await complete(row.id, claim.fencing_token, { status: "failed", errorCode: "NO_HANDLER", errorMessage: `No handler for ${row.kind}` });
        continue;
      }
      const outcome = await handler({ jobId: row.id, ...ctx, fencingToken: claim.fencing_token });
      await settle(row.id, claim.fencing_token, outcome);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("job.handler_crashed", { jobId: row.id, kind: row.kind, error: message });
      await complete(row.id, claim.fencing_token, {
        status: "failed",
        errorCode: "HANDLER_CRASH",
        errorMessage: message,
      });
    }
  }
  return processed;
}

async function loadContext(jobId: string): Promise<{ userId: string | null; entityId: string | null }> {
  const rows = await db.execute(sql`SELECT user_id, entity_id FROM jobs WHERE id = ${jobId}::uuid`);
  const row = rows.rows[0] as { user_id: string | null; entity_id: string | null };
  return { userId: row.user_id, entityId: row.entity_id };
}

async function settle(jobId: string, fencingToken: number, outcome: HandlerOutcome): Promise<void> {
  if (outcome.status === "succeeded") {
    await complete(jobId, fencingToken, outcome);
    return;
  }
  if (outcome.status === "failed") {
    // Retry permanent-looking failures only if attempts remain and the
    // handler marked it retriable via code semantics (transient providers
    // return `retry` explicitly; `failed` is terminal).
    await complete(jobId, fencingToken, outcome);
    return;
  }
  if (outcome.status === "deferred") {
    await db.execute(sql`
      SELECT schedule_job_retry(${jobId}::uuid, ${fencingToken}, ${outcome.availableAfter.toISOString()}::timestamptz)
    `);
    return;
  }
  // retry: honor the attempt budget, then dead-letter to failed.
  const rows = await db.execute(sql`SELECT attempts, max_attempts FROM jobs WHERE id = ${jobId}::uuid`);
  const job = rows.rows[0] as { attempts: number; max_attempts: number };
  if (job.attempts >= job.max_attempts) {
    await complete(jobId, fencingToken, {
      status: "failed",
      errorCode: outcome.errorCode,
      errorMessage: outcome.errorMessage,
    });
    return;
  }
  const backoff = Math.min(outcome.retryAfterSeconds, 300);
  await db.execute(sql`
    SELECT schedule_job_retry(${jobId}::uuid, ${fencingToken}, (now() + make_interval(secs => ${backoff}))::timestamptz)
  `);
}

async function complete(
  jobId: string,
  fencingToken: number,
  outcome: Extract<HandlerOutcome, { status: "succeeded" | "failed" }>,
): Promise<void> {
  const state = outcome.status === "succeeded" ? "succeeded" : "failed";
  await db.execute(sql`
    SELECT complete_job(
      ${jobId}::uuid, ${fencingToken}, ${state},
      ${outcome.result ? JSON.stringify(outcome.result) : null}::jsonb,
      ${"errorCode" in outcome ? outcome.errorCode : null},
      ${"errorMessage" in outcome ? outcome.errorMessage : null}
    )
  `);
}

/** Outbox dispatcher (§20.2 step 3): local transport marks events published;
 * production publishes to the queue and only then marks the event. */
export async function dispatchOutbox(limit = 50): Promise<number> {
  const config = getConfig();
  const rows = await db.execute(sql`
    UPDATE outbox_events
    SET publish_state = 'published', published_at = now(), attempts = attempts + 1
    WHERE id IN (
      SELECT id FROM outbox_events
      WHERE publish_state = 'pending' AND next_attempt_at <= now()
      ORDER BY created_at ASC
      LIMIT ${limit}
    )
    RETURNING id, kind, payload
  `);
  if (rows.rows.length > 0 && config.APP_ENV === "development") {
    logger.debug("outbox.dispatched", { count: rows.rows.length });
  }
  return rows.rows.length;
}

/** Recovery sweep (§20.5): reclaim expired leases, deadline breaches. */
export async function recoverySweep(): Promise<void> {
  const expired = await db.execute(sql`
    UPDATE jobs SET state = 'queued', lease_owner = NULL, lease_expires_at = NULL, updated_at = now()
    WHERE state = 'running' AND lease_expires_at < now()
    RETURNING id, kind
  `);
  if (expired.rows.length > 0) {
    logger.warn("jobs.leases_recovered", { count: expired.rows.length });
  }

  const breached = await db.execute(sql`
    UPDATE jobs SET state = 'needs_attention', error_code = 'DEADLINE_BREACH', updated_at = now()
    WHERE state = 'running' AND deadline_at < now()
    RETURNING id
  `);
  if (breached.rows.length > 0) {
    logger.error("jobs.deadline_breached", { count: breached.rows.length });
  }
}

let running = false;
const globalForWorker = globalThis as unknown as { __applyBeeWorker?: boolean };

export function startWorkerLoop(intervalMs = 1_000): void {
  if (globalForWorker.__applyBeeWorker || running) return;
  running = true;
  globalForWorker.__applyBeeWorker = true;
  logger.info("worker.started", { workerId: WORKER_ID });

  let ticks = 0;
  const timer = setInterval(async () => {
    ticks++;
    try {
      await processDueJobs(5);
      await dispatchOutbox(50);
      if (ticks % 60 === 0) {
        await recoverySweep();
        // Sweeper + reminders run on the minute cadence (§20.5).
        await db.execute(sql`
          INSERT INTO jobs (kind) SELECT 'credits.reconcile'
          WHERE NOT EXISTS (SELECT 1 FROM jobs WHERE kind = 'credits.reconcile' AND state IN ('queued','running','retry_wait') )
          AND NOT EXISTS (SELECT 1 FROM jobs WHERE kind = 'credits.reconcile' AND state = 'succeeded' AND updated_at > now() - interval '5 minutes')
        `);
        await db.execute(sql`
          INSERT INTO jobs (kind) SELECT 'reminders.materialize'
          WHERE NOT EXISTS (SELECT 1 FROM jobs WHERE kind = 'reminders.materialize' AND state IN ('queued','running','retry_wait'))
            AND NOT EXISTS (SELECT 1 FROM jobs WHERE kind = 'reminders.materialize' AND state = 'succeeded' AND updated_at > now() - interval '60 seconds')
        `);
      }
    } catch (err) {
      logger.error("worker.loop_error", { error: String(err) });
    }
  }, intervalMs);

  // Never keep the process alive just for the worker in serverless contexts.
  (timer as unknown as { unref?: () => void }).unref?.();
}

export function stopWorkerLoop(): void {
  running = false;
  globalForWorker.__applyBeeWorker = false;
}

export function workerId(): string {
  return WORKER_ID;
}
