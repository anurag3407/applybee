import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { getTestDb, createTestUser, seedTestContact } from "../setup/db";

/**
 * End-to-end AI drafting (§13.3/§18.4): preflight → reserve → snapshot → job →
 * validated proposal → credit consumed, run against a real PostgreSQL with the
 * audited ledger functions. Nothing else in the suite exercised `draft.generate`
 * — the one handler that spends a user's credit.
 *
 * Forces the labeled offline sample model, so no provider call is made and no
 * token is spent, while every server-side gate stays real: the draft is drafted
 * only from approved facts and its citations are validated against the snapshot.
 */

// Cleared before @/server/config memoizes. IS_OPENROUTER is checked first in the
// mode resolution, so leaving a developer's .env value would pick the live
// provider instead of the sample model.
for (const k of ["OPENROUTER_API_KEY", "GEMINI_API_KEY", "AI_PROVIDER", "IS_OPENROUTER", "isOpenrouter", "isOpenRouter"]) {
  delete process.env[k];
}

let client: Client;
let startGeneration: typeof import("@/server/services/generations").startGeneration;
let getGenerationStatus: typeof import("@/server/services/generations").getGenerationStatus;
let createDraft: typeof import("@/server/services/drafts").createDraft;
let draftGenerate: NonNullable<(typeof import("@/server/jobs/handlers"))["HANDLERS"]["draft.generate"]>;

beforeAll(async () => {
  client = await getTestDb();
  ({ startGeneration } = await import("@/server/services/generations"));
  ({ getGenerationStatus } = await import("@/server/services/generations"));
  ({ createDraft } = await import("@/server/services/drafts"));
  const handlers = await import("@/server/jobs/handlers");
  draftGenerate = handlers.HANDLERS["draft.generate"]!;
});

async function seedApprovedProfile(userId: string) {
  const profile = await client.query<{ id: string }>(
    `INSERT INTO candidate_profiles (user_id) VALUES ($1) RETURNING id`,
    [userId],
  );
  const revision = await client.query<{ id: string }>(
    `INSERT INTO candidate_profile_revisions
       (user_id, profile_id, revision_no, source, content_hash, approved_at)
     VALUES ($1, $2, 1, 'resume', 'seed-hash', now()) RETURNING id`,
    [userId, profile.rows[0]!.id],
  );
  await client.query(
    `UPDATE candidate_profiles SET current_revision_id = $1 WHERE id = $2`,
    [revision.rows[0]!.id, profile.rows[0]!.id],
  );
  await client.query(
    `INSERT INTO candidate_facts (profile_revision_id, user_id, fact_type, text, approved)
     VALUES ($1, $2, 'achievement', 'Cut p99 latency 40% on a payments service.', true),
            ($1, $2, 'skill', 'TypeScript and PostgreSQL', true)`,
    [revision.rows[0]!.id, userId],
  );
  return revision.rows[0]!.id;
}

async function aiAccount(userId: string) {
  const res = await client.query<{ available: number; reserved: number }>(
    `SELECT available, reserved FROM credit_accounts WHERE user_id = $1 AND type = 'ai'`,
    [userId],
  );
  return res.rows[0]!;
}

describe("draft.generate end to end", () => {
  it("turns one credit into a validated, cited proposal and reports its grounding warnings", async () => {
    const userId = await createTestUser(`gen-${randomUUID()}@test.example`, 5, 2);
    await seedApprovedProfile(userId);
    const contactId = await seedTestContact("Generation Co", `gen-${randomUUID()}.test.example`);

    const draftId = await createDraft({
      userId,
      mode: "quick_ai",
      intent: "intro",
      recipient: { kind: "directory", contactId },
      subject: "seed",
      body: "Seeded manual body long enough to be a real introduction for a hiring manager.",
    });

    const before = await aiAccount(userId);
    expect(before).toEqual({ available: 2, reserved: 0 });

    const { generationId } = await startGeneration({
      userId,
      draftId,
      input: { intent: "intro", tone: "warm_professional", length: 90 },
      idempotencyKey: `idem-${randomUUID()}`,
    });

    // Reserving put the credit on hold and locked the editor.
    const reserved = await aiAccount(userId);
    expect(reserved).toEqual({ available: 1, reserved: 1 });
    const locked = await client.query<{ status: string }>(`SELECT status FROM drafts WHERE id = $1`, [draftId]);
    expect(locked.rows[0]!.status).toBe("generating");

    const outcome = await draftGenerate({ jobId: randomUUID(), userId, entityId: generationId, fencingToken: 1 });
    expect(outcome.status).toBe("succeeded");

    const gen = (
      await client.query<{
        state: string;
        model_id: string | null;
        prompt_version: string | null;
        proposed_revision_id: string | null;
        usage: { warnings?: string[]; factsUsed?: number; words?: number } | null;
      }>(
        `SELECT state, model_id, prompt_version, proposed_revision_id, usage FROM generation_requests WHERE id = $1`,
        [generationId],
      )
    ).rows[0]!;
    expect(gen.state).toBe("ready");
    expect(gen.model_id).toBe("sample-offline");
    expect(gen.proposed_revision_id).toBeTruthy();

    // The credit is consumed exactly once, and the editor is released.
    expect(await aiAccount(userId)).toEqual({ available: 1, reserved: 0 });
    const settled = await client.query<{ status: string }>(`SELECT status FROM drafts WHERE id = $1`, [draftId]);
    expect(settled.rows[0]!.status).toBe("active");

    const revision = (
      await client.query<{ subject: string; body: string; content_hash: string; generation_id: string | null }>(
        `SELECT subject, body, content_hash, generation_id FROM draft_revisions WHERE id = $1`,
        [gen.proposed_revision_id!],
      )
    ).rows[0]!;
    expect(revision.subject.startsWith("[Sample AI draft]")).toBe(true);
    expect(revision.generation_id).toBe(generationId);
    // A real digest, not the `len:len` placeholder that made changed-content
    // detection impossible.
    expect(revision.content_hash).toMatch(/^[0-9a-f]{32}$/);
    // Drafted from the snapshot: recipient first name from the directory contact.
    expect(revision.body).toContain("Test,");

    const claims = await client.query<{ validation_result: string; fact_ids: string[] }>(
      `SELECT validation_result, fact_ids FROM draft_claims WHERE revision_id = $1`,
      [gen.proposed_revision_id!],
    );
    expect(claims.rowCount).toBeGreaterThan(0);
    for (const claim of claims.rows) {
      expect(claim.fact_ids.length).toBeGreaterThan(0);
      expect(claim.validation_result).toBe("supported");
    }

    // Every fact cited by the model must be one the user actually approved.
    const approved = await client.query<{ id: string }>(
      `SELECT id FROM candidate_facts WHERE profile_revision_id =
         (SELECT profile_revision_id FROM draft_revisions WHERE id = $1) AND approved = true`,
      [gen.proposed_revision_id!],
    );
    const approvedIds = new Set(approved.rows.map((r) => r.id));
    for (const claim of claims.rows) {
      for (const id of claim.fact_ids) expect(approvedIds.has(id)).toBe(true);
    }

    // The API contract the composer renders against: the proposal plus its
    // grounding warnings. No company evidence and no target role were supplied,
    // so both caveats must reach the client instead of being discarded.
    const status = await getGenerationStatus(userId, generationId);
    expect(status?.state).toBe("ready");
    expect(status?.proposal?.subject).toBe(revision.subject);
    expect(status?.usage).toMatchObject({ warnings: ["missing_company_context", "missing_role_context"] });

    // The grounding panel's contract: every claim the draft rests on, resolved
    // back to the confirmed sentence behind it.
    const pollClaims = status?.proposal?.claims ?? [];
    expect(pollClaims.length).toBeGreaterThan(0);
    expect(pollClaims[0]!.facts.length).toBeGreaterThan(0);
    expect(pollClaims[0]!.facts[0]!.text).toContain("p99 latency");
    expect(pollClaims[0]!.excerpt.length).toBeGreaterThan(0);

    // Reload path: the editor is re-rendered server-side from getDraftForUser,
    // which must hand back the still-pending proposal. Without it the composer
    // shows Apply/Dismiss (driven by the generation state) over an empty preview,
    // so the user approves an email they cannot read.
    const { getDraftForUser } = await import("@/server/services/drafts");
    const reloaded = await getDraftForUser(userId, draftId);
    expect(reloaded?.pendingProposal?.subject).toBe(revision.subject);
    expect(reloaded?.pendingProposal?.body).toBe(revision.body);
    expect(reloaded?.pendingProposal?.claims).toEqual(pollClaims);
    // Provenance: a draft names the confirmed profile revision it was written
    // from, so a newer profile cannot be silently ignored.
    expect(status?.proposal?.profileRevision).toMatchObject({ revisionNo: 1, source: "resume" });
    expect(reloaded?.pendingProposal?.profileRevision).toMatchObject({ revisionNo: 1, source: "resume" });
  });

  it("refuses to draft for a user with no approved facts and spends nothing", async () => {
    const userId = await createTestUser(`nofacts-${randomUUID()}@test.example`, 5, 2);
    const contactId = await seedTestContact("No Facts Co", `nofacts-${randomUUID()}.test.example`);
    const draftId = await createDraft({
      userId,
      mode: "quick_ai",
      intent: "intro",
      recipient: { kind: "directory", contactId },
      body: "A body that exists before any AI draft is attempted at all here.",
    });

    await expect(
      startGeneration({
        userId,
        draftId,
        input: { intent: "intro", tone: "warm_professional", length: 90 },
        idempotencyKey: `idem-${randomUUID()}`,
      }),
    ).rejects.toMatchObject({ code: "NO_CONFIRMED_FACTS" });

    expect(await aiAccount(userId)).toEqual({ available: 2, reserved: 0 });
  });

  it("confirms only the selected facts, leaving the rest unusable by the AI", async () => {
    const userId = await createTestUser(`subset-${randomUUID()}@test.example`, 5, 2);
    const profile = await client.query<{ id: string }>(
      `INSERT INTO candidate_profiles (user_id) VALUES ($1) RETURNING id`,
      [userId],
    );
    const revision = await client.query<{ id: string }>(
      `INSERT INTO candidate_profile_revisions
         (user_id, profile_id, revision_no, source, content_hash)
        VALUES ($1, $2, 1, 'resume', 'seed-hash') RETURNING id`,
      [userId, profile.rows[0]!.id],
    );
    const revisionId = revision.rows[0]!.id;
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO candidate_facts (profile_revision_id, user_id, fact_type, text, approved)
       VALUES ($1, $2, 'achievement', 'Cut p99 latency 40%.', false),
              ($1, $2, 'skill', 'TypeScript and PostgreSQL', false),
              ($1, $2, 'experience', 'Worked at a fintech for two years', false)
       RETURNING id`,
      [revisionId, userId],
    );
    const keepA = inserted.rows[0]!.id;
    const keepB = inserted.rows[1]!.id;
    const drop = inserted.rows[2]!.id;

    const { approveProfileRevision, hasApprovedProfile } = await import("@/server/services/resumes");
    await approveProfileRevision(userId, revisionId, [keepA, keepB]);

    const states = await client.query<{ id: string; approved: boolean }>(
      `SELECT id, approved FROM candidate_facts WHERE profile_revision_id = $1`,
      [revisionId],
    );
    const byId = new Map(states.rows.map((r) => [r.id, r.approved]));
    expect(byId.get(keepA)).toBe(true);
    expect(byId.get(keepB)).toBe(true);
    // Declined facts stay unapproved rather than deleted, so they can be confirmed
    // later without re-parsing the resume.
    expect(byId.get(drop)).toBe(false);

    const current = await client.query<{ current_revision_id: string }>(
      `SELECT current_revision_id FROM candidate_profiles WHERE user_id = $1`,
      [userId],
    );
    expect(current.rows[0]!.current_revision_id).toBe(revisionId);
    expect(await hasApprovedProfile(userId)).toBe(true);

    // Ids that are not part of this revision cannot approve anything.
    await expect(approveProfileRevision(userId, revisionId, [randomUUID()])).rejects.toThrow("NO_FACTS_TO_APPROVE");
  });
});
