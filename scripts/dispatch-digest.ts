import "dotenv/config";
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
    console.log(`[digest:dispatch] Seeded ${seeded} curated hiring posts.`);
  }

  const force = process.argv.includes("--force");
  console.log(`[digest:dispatch] Starting daily dispatch (force=${force})...`);
  const result = await dispatchAllDueDigests({ force });
  console.log(
    `[digest:dispatch] Complete! Eligible: ${result.totalEligible}, Dispatched: ${result.dispatched}, Skipped: ${result.skipped}, Failed: ${result.failed}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[digest:dispatch] Error running daily digest:", err);
  process.exit(1);
});
