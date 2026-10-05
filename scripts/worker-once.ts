import "./env";
import Module from "node:module";

// Stub 'server-only' for Node CLI execution
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string) {
  if (id === "server-only") return {};
  return originalRequire.apply(this, arguments);
};

async function main() {
  const { processDueJobs } = await import("../src/server/jobs/runner");
  console.log("[worker:once] Processing pending background jobs...");
  const processed = await processDueJobs(10);
  console.log(`[worker:once] Finished. Processed ${processed} job(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[worker:once] Failed:", err);
  process.exit(1);
});
