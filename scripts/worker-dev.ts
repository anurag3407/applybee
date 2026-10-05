import "./env";
import Module from "node:module";

// Stub 'server-only' for Node CLI execution
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string) {
  if (id === "server-only") return {};
  return originalRequire.apply(this, arguments);
};

async function main() {
  const { startWorkerLoop } = await import("../src/server/jobs/runner");
  console.log("[worker:dev] Starting ApplyBee background job worker...");
  startWorkerLoop(1500);
}

main().catch((err) => {
  console.error("[worker:dev] Failed:", err);
  process.exit(1);
});
