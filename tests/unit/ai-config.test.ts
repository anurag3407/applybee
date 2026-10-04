import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { validateGroundedDraft, getDraftModel, type GroundedDraftInput } from "@/server/adapters/ai";

describe("AI validation and parser tests", () => {
  const dummyInput: GroundedDraftInput = {
    mode: "quick_ai",
    intent: "advertised_role",
    tone: "concise",
    lengthTarget: 80,
    recipientFirstName: "Priya",
    recipientTitle: "Engineering Manager",
    companyName: "Lumen Analytics",
    candidateName: "Alex Doe",
    candidateFacts: [
      { id: "f1", factType: "project", text: "Built ETL pipeline" },
    ],
    companyEvidence: [
      { id: "e1", factType: "focus", value: "Realtime analytics", sourceName: "Blog", checkedAt: null },
    ],
  };

  it("validates well-formed model output successfully", () => {
    const raw = {
      subject: "Backend Engineer inquiry",
      body: "Hi Priya, I built an ETL pipeline. I saw your team focuses on Realtime analytics. Alex Doe.",
      intent: "advertised_role",
      candidateFactIds: ["f1"],
      companyEvidenceIds: ["e1"],
      claimReferences: [{ excerpt: "Built an ETL pipeline", factIds: ["f1"], evidenceIds: [] }],
      warnings: [],
    };
    const validated = validateGroundedDraft(raw, dummyInput);
    expect(validated.subject).toBe("Backend Engineer inquiry");
    expect(validated.candidateFactIds).toContain("f1");
    expect(validated.companyEvidenceIds).toContain("e1");
  });

  it("rejects model outputs with unknown fact IDs", () => {
    const raw = {
      subject: "Backend Engineer inquiry",
      body: "Hi Priya, I built an ETL pipeline. Alex Doe.",
      intent: "advertised_role",
      candidateFactIds: ["unknown_hallucinated_id"],
      companyEvidenceIds: [],
      claimReferences: [],
      warnings: [],
    };
    expect(() => validateGroundedDraft(raw, dummyInput)).toThrow("outside the confirmed snapshot");
  });

  it("resolves model correctly depending on environment", () => {
    const { model, modelId } = getDraftModel();
    expect(model).toBeDefined();
    expect(typeof modelId).toBe("string");
  });
});
