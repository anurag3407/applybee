import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { getConfig } from "@/server/config";
import { logger } from "@/server/logger";
import { apiError, ok, route } from "@/server/http";
import { dispatchAllDueDigests, seedInitialHiringPostsIfEmpty } from "@/server/services/digest";
import { dispatchOutbox, processDueJobs, recoverySweep } from "@/server/jobs/runner";
import { enqueueJob } from "@/server/services/jobs";

/**
 * Scheduler entry point (POST/GET /api/v1/cron/run).
 *
 * The deployed Cloudflare Worker has no timer: `startWorkerLoop` relies on
 * setInterval, which Workers freeze between requests, and the OpenNext
 * Cloudflare integration emits no `scheduled` handler. Nothing therefore
 * drained the durable job queue (resume scanning, AI generation, credit
 * reconcile, reminders) or dispatched the daily digest in production.
 *
 * An external scheduler (GitHub Actions, Cloudflare Cron hitting this route,
 * any cron service) calls this with `Authorization: Bearer $CRON_SECRET`. It
 * is unauthenticated by user session on purpose — it must run when nobody is
 * signed in — so the shared secret is the entire trust boundary.
 */

function authorized(req: Request): boolean {
  const secret = getConfig().CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!presented) return false;
  // Length check first, then constant-time compare on equal-length buffers.
  if (presented.length !== secret.length) return false;
  let mismatch = 0;
  for (let i = 0; i < presented.length; i++) {
    mismatch |= presented.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Seed the recurring housekeeping jobs if they are not already queued. */
async function seedRecurringJobs(): Promise<void> {
  const seeds = [
    { kind: "credits.reconcile", suppressAfter: "5 minutes" },
    { kind: "reminders.materialize", suppressAfter: "1 minute" },
  ];
  for (const { kind, suppressAfter } of seeds) {
    await db.execute(sql`
      INSERT INTO jobs (kind)
      SELECT ${kind}
      WHERE NOT EXISTS (
        SELECT 1 FROM jobs
        WHERE kind = ${kind} AND state IN ('queued','running','retry_wait','deferred')
      )
      AND NOT EXISTS (
        SELECT 1 FROM jobs
        WHERE kind = ${kind} AND state = 'succeeded' AND updated_at > now() - ${suppressAfter}::interval
      )
    `);
  }
}

async function handle(req: Request) {
  const config = getConfig();
  if (!config.CRON_SECRET) {
    logger.error("cron.secret_missing", {});
    return apiError(503, "NOT_CONFIGURED", "CRON_SECRET is not configured.");
  }
  if (!authorized(req)) {
    return apiError(401, "UNAUTHORIZED", "Invalid scheduler credentials.");
  }

  const startedAt = Date.now();
  const force = new URL(req.url).searchParams.get("force") === "1";

  // Clamped: a malformed CRON_JOB_BATCH would otherwise reach `LIMIT $n` as
  // NaN or a negative number and fail the whole run.
  const batch = Number(process.env.CRON_JOB_BATCH);
  const jobBatch = Number.isFinite(batch) ? Math.min(Math.max(Math.trunc(batch), 1), 200) : 25;

  // Housekeeping first so a long digest cannot starve the queue.
  await seedRecurringJobs();
  await recoverySweep();
  const dispatchedJobs = await processDueJobs(jobBatch);
  const outboxEvents = await dispatchOutbox(100);

  let digest: { totalEligible: number; dispatched: number; skipped: number; failed: number } | null = null;
  let digestError: string | null = null;
  let digestEnqueued = false;
  if (force || isDigestHour()) {
    try {
      await seedInitialHiringPostsIfEmpty();
      if (force) {
        // Manual trigger: run one batch inline so the caller sees a result.
        const result = await dispatchAllDueDigests({ force: true, batchSize: 25 });
        digest = {
          totalEligible: result.totalEligible,
          dispatched: result.dispatched,
          skipped: result.skipped,
          failed: result.failed,
        };
        if (result.nextCursor) {
          // Seeded with no cursor so the queue picks up from the beginning.
          await enqueueJob({ kind: "digest.dispatch_daily", maxAttempts: 3, deadlineSeconds: 120 });
        }
      } else {
        // Scheduled run: hand the whole dispatch to the queue so it is batched
        // and cannot exceed this request's wall-clock budget.
        await enqueueJob({ kind: "digest.dispatch_daily", maxAttempts: 3, deadlineSeconds: 120 });
        digestEnqueued = true;
      }
    } catch (err) {
      digestError = err instanceof Error ? err.message : String(err);
      logger.error("cron.digest_failed", { error: digestError });
    }
  }

  logger.info("cron.run", {
    jobs: dispatchedJobs,
    outbox: outboxEvents,
    digestDispatched: digest?.dispatched ?? 0,
    digestFailed: digest?.failed ?? 0,
    digestEnqueued,
    durationMs: Date.now() - startedAt,
  });

  return ok({
    jobs: dispatchedJobs,
    outbox: outboxEvents,
    digest,
    digestEnqueued,
    digestError,
    durationMs: Date.now() - startedAt,
  });
}

/**
 * The digest is a once-daily send, so it only runs during a wide window that
 * covers every configured user timezone without a scheduler-per-user setup.
 * Outside that window this endpoint still drains the job queue.
 */
function isDigestHour(): boolean {
  const hour = Number(process.env.CRON_DIGEST_HOUR_UTC ?? 6);
  return new Date().getUTCHours() === hour;
}

export const POST = route(handle);

export const GET = route(handle);