/**
 * Next.js instrumentation (§27.2 local queue adapter): the embedded dev
 * worker executes durable DB jobs in-process with full outbox/idempotency
 * semantics — no inline business-logic shortcuts. Production runs the same
 * runner as a dedicated worker service (docs/runbooks/deployment.md).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.APP_WORKER_EMBEDDED === "false") return;

  // On Cloudflare Workers this interval never ticks — the isolate is frozen
  // between requests — so an embedded loop there just logs "worker started"
  // and then silently does nothing. When a scheduler is configured, the
  // external endpoint is the real driver; say so explicitly instead of leaving
  // a misleading log line. See the "Background jobs in production" section of
  // the README and src/app/api/v1/cron/run/route.ts.
  if (process.env.CRON_SECRET && !process.env.APP_WORKER_EMBEDDED) {
    console.log(
      "[instrumentation] CRON_SECRET is set — background jobs are driven by POST /api/v1/cron/run, not the embedded loop.",
    );
    return;
  }

  try {
    const { startWorkerLoop } = await import("@/server/jobs/runner");
    startWorkerLoop(1_500);
  } catch (err) {
    console.error("[instrumentation] worker bootstrap failed:", err);
  }
}
