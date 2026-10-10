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

/**
 * Lease and deadline for a claimed job.
 *
 * The lease must comfortably exceed the slowest handler, or the job is
 * reclaimed while it is still running and a second worker processes it too.
 * `draft.generate` is the slow one: it can make two model calls (the original
 * plus one repair attempt), each with a 60s provider timeout, so 120s left no
 * margin. The deadline is per-attempt (see claim_job in src/db/functions.sql),
 * so it does not need to cover the whole retry chain.
 */
const JOB_LEASE_SECONDS = 300;
const JOB_DEADLINE_SECONDS = 300;

export async function processDueJobs(limit = 5): Promise<number> {
  // user_id/entity_id come out with the due row: they were re-read one query per
  // job right after claiming it, which made three round trips per job for data
  // that cannot change between the two reads.
  const due = await db.execute(sql`
    SELECT id, kind, user_id, entity_id FROM jobs
    WHERE (state IN ('queued','retry_wait','deferred') AND available_after <= now())
       OR (state = 'running' AND (lease_expires_at IS NULL OR lease_expires_at < now()))
    ORDER BY available_after ASC
    LIMIT ${limit}
  `);

  let processed = 0;
  for (const row of due.rows as Array<{
    id: string;
    kind: string;
    user_id: string | null;
    entity_id: string | null;
  }>) {
    const claimed = await db.execute(sql`
      SELECT claim_job(${row.id}::uuid, ${WORKER_ID}, ${JOB_LEASE_SECONDS}, ${JOB_DEADLINE_SECONDS}) AS out
    `);
    const claim = (claimed.rows[0] as { out: { fencing_token: number } | null } | null)?.out;
    if (!claim) continue;
    processed++;
    try {
      const handler = HANDLERS[row.kind];
      if (!handler) {
        await complete(row.id, claim.fencing_token, { status: "failed", errorCode: "NO_HANDLER", errorMessage: `No handler for ${row.kind}` });
        continue;
      }
      const outcome = await handler({
        jobId: row.id,
        userId: row.user_id,
        entityId: row.entity_id,
        fencingToken: claim.fencing_token,
      });
      await settle(row.id, claim.fencing_token, outcome);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("job.handler_crashed", { jobId: row.id, kind: row.kind, error: message });
      // Recording the crash must never itself throw out of the loop: a
      // transient DB failure here would abort the whole pass and leave every
      // remaining due job unprocessed this cycle. The lease will expire and
      // the job will be reclaimed regardless.
      try {
        await complete(row.id, claim.fencing_token, {
          status: "failed",
          errorCode: "HANDLER_CRASH",
          errorMessage: message,
        });
      } catch (settleErr) {
        logger.error("job.crash_record_failed", {
          jobId: row.id,
          kind: row.kind,
          error: settleErr instanceof Error ? settleErr.message : String(settleErr),
        });
      }
    }
  }
  return processed;
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
  // The row can be gone (deleted, or reclaimed and completed by another worker
  // between our handler returning and this settle). Dereferencing it blindly
  // threw a TypeError that masked the handler's real outcome.
  const job = rows.rows[0] as { attempts: number; max_attempts: number } | undefined;
  if (!job) {
    logger.warn("job.settle_missing_row", { jobId, fencingToken });
    return;
  }
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
  // SKIP LOCKED keeps two overlapping cron runs from claiming the same rows:
  // without it both dispatched the same batch and each counted the other's
  // events as its own. `payload` is not returned — nothing here publishes it,
  // and the JSONB round trip was the bulk of the bytes on this query.
  const rows = await db.execute(sql`
    UPDATE outbox_events
    SET publish_state = 'published', published_at = now(), attempts = attempts + 1
    WHERE id IN (
      SELECT id FROM outbox_events
      WHERE publish_state = 'pending' AND next_attempt_at <= now()
      ORDER BY created_at ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, kind
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

export function workerId(): string {
  return WORKER_ID;
}
