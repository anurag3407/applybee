/**
 * AI provider preflight — verifies the drafting pipeline can actually reach a
 * model and get valid JSON back, without creating a user, reserving a credit,
 * or enqueuing a job.
 *
 * Run: `pnpm ai:check`
 */
import "./env";
import Module from "node:module";

// Stub 'server-only' for Node CLI execution
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string) {
  if (id === "server-only") return {};
  return originalRequire.apply(this, arguments);
};

async function main() {
  const { getConfig } = await import("../src/server/config");
  const config = getConfig();

  console.log(`aiMode      : ${config.aiMode}`);
  console.log(`APP_ENV     : ${config.APP_ENV}`);
  console.log(`AI enabled  : ${config.FEATURE_AI_ENABLED}`);

  if (config.aiMode === "mock") {
    console.log("\nNo OPENROUTER_API_KEY or GEMINI_API_KEY is set, so drafting would run the");
    console.log("labeled offline sample model. Set OPENROUTER_API_KEY to test the real one.");
    return;
  }
  if (!config.FEATURE_AI_ENABLED) {
    console.log("\nFEATURE_AI_ENABLED is false — drafting is switched off.");
  }

  const { getDraftModel, validateGroundedDraft, ModelOutputError } = await import(
    "../src/server/adapters/ai"
  );
  const { model, modelId } = getDraftModel();
  console.log(`model       : ${modelId}`);

  const input = {
    mode: "quick_ai" as const,
    intent: "intro",
    tone: "warm_professional",
    lengthTarget: 90,
    recipientFirstName: "Priya",
    recipientTitle: "Engineering Manager",
    companyName: "Acme",
    candidateName: "Sam",
    candidateFacts: [
      { id: "probe-fact-1", factType: "achievement", text: "Cut p99 latency 40% on a payments service." },
    ],
    companyEvidence: [],
  };

  console.log("\nCalling provider…");
  const startedAt = Date.now();
  try {
    const raw = await model.compose(input);
    const draft = validateGroundedDraft(raw, input);
    console.log(`OK in ${Date.now() - startedAt}ms`);
    console.log(`subject    : ${draft.subject}`);
    console.log(`body length: ${draft.body.length} chars`);
    console.log(`factIds    : ${draft.candidateFactIds.join(", ") || "(none)"}`);
    console.log(`warnings   : ${draft.warnings.join(", ") || "(none)"}`);
    console.log("\nDrafting should work. No credit was spent.");
  } catch (err) {
    console.error(`\nFAILED after ${Date.now() - startedAt}ms`);
    if (err instanceof ModelOutputError) {
      console.error(`Model output rejected: ${err.message}`);
    } else {
      console.error(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
    }
    console.error("\nCommon causes:");
    console.error("  - OPENROUTER_MODEL_ID does not exist or your key cannot use it");
    console.error("  - OPENROUTER_API_KEY is missing/invalid");
    console.error("  - the provider is unreachable from this network");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[ai:check] Error:", err);
  process.exit(1);
});