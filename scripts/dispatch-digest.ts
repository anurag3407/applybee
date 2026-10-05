import "./env";
import Module from "node:module";

// Stub 'server-only' for Node CLI execution
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string) {
  if (id === "server-only") return {};
  return originalRequire.apply(this, arguments);
};

async function main() {
  const { dispatchAllDueDigests, seedInitialHiringPostsIfEmpty } = await import("../src/server/services/digest");
  console.log("[digest:dispatch] Checking initial hiring posts catalog...");
  const seeded = await seedInitialHiringPostsIfEmpty();
  if (seeded > 0) {
    console.log(`[digest:dispatch] Seeded ${seeded} sample hiring posts.`);
  }

  const force = process.argv.includes("--force");
  console.log(`[digest:dispatch] Starting daily dispatch (force=${force})...`);

  // dispatchAllDueDigests is batched (the production path re-enqueues itself
  // through the job queue), so loop through every batch here.
  let cursor: string | null = null;
  const totals = { eligible: 0, dispatched: 0, skipped: 0, failed: 0 };
  let guard = 0;
  do {
    const result = await dispatchAllDueDigests({ force, batchSize: 50, afterUserId: cursor });
    totals.eligible += result.totalEligible;
    totals.dispatched += result.dispatched;
    totals.skipped += result.skipped;
    totals.failed += result.failed;
    cursor = result.nextCursor;
    if (cursor) console.log(`[digest:dispatch] …${totals.dispatched} dispatched so far, continuing.`);
  } while (cursor && ++guard < 200);

  console.log(
    `[digest:dispatch] Complete! Processed: ${totals.eligible}, Dispatched: ${totals.dispatched}, Skipped: ${totals.skipped}, Failed: ${totals.failed}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[digest:dispatch] Error running daily digest:", err);
  process.exit(1);
});