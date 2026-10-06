import { describe, it, expect } from "vitest";
import {
  validateGroundedDraft,
  ModelOutputError,
  getDraftModel,
  type GroundedDraftInput,
} from "@/server/adapters/ai";

/**
 * `validateGroundedDraft` is the gate that decides whether one copilot credit
 * is consumed (a validated artifact) or released (the model produced something
 * untrustworthy). These tests pin that contract, because a regression here
 * either charges users for nothing or, worse, accepts invented claims.
 */

const FACT_IDS = ["fact-1", "fact-2"];
const EVIDENCE_IDS = ["ev-1"];

function input(): GroundedDraftInput {
  return {
    mode: "quick_ai",
    intent: "intro",
    tone: "warm_professional",
    lengthTarget: 90,
    recipientFirstName: "Priya",
    recipientTitle: "Engineering Manager",
    companyName: "Acme",
    candidateName: "Sam",
    candidateFacts: [
      { id: FACT_IDS[0]!, factType: "achievement", text: "Cut p99 latency 40% on a payments service." },
      { id: FACT_IDS[1]!, factType: "skill", text: "TypeScript, PostgreSQL, Next.js." },
    ],
    companyEvidence: [
      { id: EVIDENCE_IDS[0]!, factType: "stack", value: "Built on TypeScript", sourceName: "jobs page", checkedAt: null },
    ],
  };
}

function validDraft(overrides: Record<string, unknown> = {}) {
  return {
    subject: "Introduction — Staff Engineer at Acme",
    body:
      "Hi Priya,\n\nI lead a payments service where I cut p99 latency by 40%. I work in TypeScript and PostgreSQL.\n\nWould you be open to a short conversation?\n\nSam",
    intent: "intro",
    candidateFactIds: [FACT_IDS[0]],
    companyEvidenceIds: [EVIDENCE_IDS[0]],
    claimReferences: [{ excerpt: "cut p99 latency by 40%", factIds: [FACT_IDS[0]], evidenceIds: [] }],
    warnings: [],
    ...overrides,
  };
}

describe("grounded draft validation", () => {
  it("accepts a draft grounded in the confirmed snapshot", () => {
    const draft = validateGroundedDraft(validDraft(), input());
    expect(draft.subject).toContain("Staff Engineer");
    expect(draft.candidateFactIds).toEqual([FACT_IDS[0]]);
    expect(draft.companyEvidenceIds).toEqual([EVIDENCE_IDS[0]]);
    expect(draft.claimReferences).toHaveLength(1);
  });

  it("falls back to the requested intent when the model returns an unknown one", () => {
    const draft = validateGroundedDraft(validDraft({ intent: "made_up_intent" }), input());
    expect(draft.intent).toBe("intro");
  });

  it("rejects a draft that cites a fact outside the snapshot", () => {
    expect(() =>
      validateGroundedDraft(validDraft({ candidateFactIds: ["fact-not-confirmed"] }), input()),
    ).toThrow(ModelOutputError);
  });

  it("rejects an empty subject", () => {
    expect(() => validateGroundedDraft(validDraft({ subject: "   " }), input())).toThrow(ModelOutputError);
  });

  it("rejects a body too short to be a real introduction", () => {
    expect(() => validateGroundedDraft(validDraft({ body: "Hi." }), input())).toThrow(ModelOutputError);
  });

  it("rejects a body that blows the word budget", () => {
    const long = Array.from({ length: 500 }, (_, i) => `word${i}`).join(" ");
    expect(() => validateGroundedDraft(validDraft({ body: `${long} ${long}` }), input())).toThrow(
      ModelOutputError,
    );
  });

  it("truncates an oversized subject rather than rejecting the draft", () => {
    const draft = validateGroundedDraft(validDraft({ subject: "x".repeat(500) }), input());
    expect(draft.subject.length).toBeLessThanOrEqual(160);
  });
});

describe("offline sample model", () => {
  it("produces a draft that passes the same validation gate", async () => {
    // Force the labeled offline adapter. tests/setup/db.ts runs
    // `dotenv/config`, so a developer's real .env can put OPENROUTER_API_KEY
    // (or GEMINI_API_KEY) into process.env and silently switch the adapter to a
    // live provider. getConfig() is lazy, so clearing them here is enough - and
    // without it this test would either fail or spend real tokens.
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.AI_PROVIDER;

    const { model, isMock } = getDraftModel();
    expect(isMock).toBe(true);

    const raw = await model.compose(input());
    const draft = validateGroundedDraft(raw, input());

    expect(draft.body.length).toBeGreaterThan(40);
    expect(draft.subject.startsWith("[Sample AI draft]")).toBe(true);
    // The sample must stay inside the confirmed snapshot too.
    for (const id of draft.candidateFactIds) {
      expect(FACT_IDS).toContain(id);
    }
  });
});