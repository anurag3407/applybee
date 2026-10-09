import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { GroundedDraftInput } from "@/server/adapters/ai";

/**
 * Regression cover for the OpenRouter adapter's JSON-mode fallback.
 *
 * `openrouter/free` load-balances across arbitrary free models, and a reasoning
 * model asked for `response_format: json_object` can spend the entire token
 * budget on its `reasoning` field and answer with HTTP 200 + `content: null`.
 * That used to be raised as a transient failure and retried with the *same*
 * JSON-mode request, so every job attempt failed identically and the user never
 * got a draft. The adapter must instead drop JSON mode and re-ask.
 */

const input: GroundedDraftInput = {
  mode: "quick_ai",
  intent: "intro",
  tone: "warm_professional",
  lengthTarget: 90,
  recipientFirstName: "Priya",
  recipientTitle: "Engineering Manager",
  companyName: "Acme",
  candidateName: "Sam",
  candidateFacts: [
    { id: "fact-1", factType: "achievement", text: "Cut p99 latency 40% on a payments service." },
  ],
  companyEvidence: [],
};

const goodDraft = JSON.stringify({
  subject: "Introduction — Sam at Acme",
  body:
    "Hi Priya,\n\nI'm Sam. I cut p99 latency by 40% on a payments service and I'd like to bring that to Acme.\n\nWould you be open to a short conversation?\n\nSam",
  intent: "intro",
  candidateFactIds: ["fact-1"],
  companyEvidenceIds: [],
  claimReferences: [{ excerpt: "cut p99 latency by 40%", factIds: ["fact-1"], evidenceIds: [] }],
  warnings: ["missing_company_context"],
});

function completion(content: string | null, finishReason = "stop") {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => ({ choices: [{ message: { content }, finish_reason: finishReason }]}),
    text: async () => "",
  } as unknown as Response;
}

function usedJsonMode(call: unknown) {
  const body = JSON.parse((call as [string, RequestInit])[1].body as string);
  return Boolean(body.response_format);
}

async function freshAdapter() {
  // getConfig() memoizes on first use, so the module has to be re-imported with
  // the provider env already pinned — a developer's real .env is loaded by
  // tests/setup/vitest-setup.ts and would otherwise decide the mode.
  // The error classes travel with it: after resetModules the adapter's
  // TransientModelError is a different class object than a pre-reset import,
  // so instanceof only holds against this same instance.
  vi.resetModules();
  const ai = await import("@/server/adapters/ai");
  return {
    model: ai.getDraftModel().model,
    TransientModelError: ai.TransientModelError,
    ModelOutputError: ai.ModelOutputError,
  };
}

describe("OpenRouter JSON-mode fallback", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.AI_PROVIDER = "openrouter";
    process.env.IS_OPENROUTER = "true";
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("re-asks without response_format when a 200 carries an empty completion", async () => {
    const calls: unknown[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (...args: unknown[]) => {
        calls.push(args);
        return completion(usedJsonMode(args) ? null : goodDraft);
      }),
    );

    const { model } = await freshAdapter();
    const draft = await model.compose(input);

    expect(calls).toHaveLength(2);
    expect(usedJsonMode(calls[0])).toBe(true);
    expect(usedJsonMode(calls[1])).toBe(false);
    expect(draft.subject).toContain("Acme");
    expect(draft.candidateFactIds).toEqual(["fact-1"]);
  });

  it("still retries once without JSON mode when the provider rejects response_format", async () => {
    const calls: unknown[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (...args: unknown[]) => {
        calls.push(args);
        if (usedJsonMode(args)) {
          return { ok: false, status: 400, headers: new Headers(), text: async () => "unsupported", json: async () => ({}) } as unknown as Response;
        }
        return completion(goodDraft);
      }),
    );

    const { model } = await freshAdapter();
    const draft = await model.compose(input);

    expect(calls).toHaveLength(2);
    expect(draft.body).toContain("Priya");
  });

  it("reports a transient model error — not an empty draft — when both modes return nothing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => completion(null)));

    const { model, TransientModelError } = await freshAdapter();
    await expect(model.compose(input)).rejects.toBeInstanceOf(TransientModelError);
  });

  it("classifies a body that fails to stream as transient instead of leaking the raw error", async () => {
    const aborted = {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => {
        throw new Error("The operation was aborted due to timeout");
      },
    } as unknown as Response;
    vi.stubGlobal("fetch", vi.fn(async () => aborted));

    const { model, TransientModelError } = await freshAdapter();
    await expect(model.compose(input)).rejects.toBeInstanceOf(TransientModelError);
  });

  it("treats a token-truncated completion as retryable, not as a permanent bad output", async () => {
    // What a reasoning model returns when it spends max_tokens on thinking and
    // is cut off mid-object. This was ModelOutputError, which the job handler
    // treats as permanent: the credit was released and the draft failed on the
    // first unlucky draw instead of using its remaining attempts.
    const truncated =
      '{"subject": "Introduction: Sam", "body": "Hi Priya,\\n\\nI hope this message finds you well. I\'m reaching out to introduce you to Sam, a talented engineer with a proven ability';
    vi.stubGlobal("fetch", vi.fn(async () => completion(truncated, "length")));

    const { model, TransientModelError } = await freshAdapter();
    await expect(model.compose(input)).rejects.toBeInstanceOf(TransientModelError);
  });

  it("keeps rejecting unparseable output that finished normally as a permanent model error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => completion("I can't write that email for you.", "stop")));

    const { model, ModelOutputError } = await freshAdapter();
    await expect(model.compose(input)).rejects.toBeInstanceOf(ModelOutputError);
  });
});
