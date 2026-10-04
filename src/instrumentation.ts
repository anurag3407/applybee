/**
 * Next.js instrumentation (§27.2 local queue adapter): the embedded dev
 * worker executes durable DB jobs in-process with full outbox/idempotency
 * semantics — no inline business-logic shortcuts. Production runs the same
 * runner as a dedicated worker service (docs/runbooks/deployment.md).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.APP_WORKER_EMBEDDED === "false") return;
  try {
    const { startWorkerLoop } = await import("@/server/jobs/runner");
    startWorkerLoop(1_500);
  } catch (err) {
    console.error("[instrumentation] worker bootstrap failed:", err);
  }
}
