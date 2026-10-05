import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { candidateProfileRevisions, candidateProfiles, candidateFacts, drafts, generationRequests } from "@/db/schema";
import { getConfig } from "@/server/config";
import { getBalances, reserveGeneration, CreditError } from "@/server/services/credits";
import { admitWithPreCheck, acquireSlot, releaseSlot, LIMITS } from "@/server/adapters/ratelimit";
import { enqueueJob } from "@/server/services/jobs";
import { withIdempotency, hashRequest } from "@/server/services/idempotency";
import { logger } from "@/server/logger";

/**
 * Generation orchestration (§13.3/§13.4, §18.4): preflight → reserve →
 * snapshot → job + outbox → 202. Charging happens when a validated artifact
 * is durably available, never when Gmail succeeds (§3.1 #6).
 */

export type GenerationStartInput = {
  intent: string;
  targetRole?: string;
  jobDescription?: string;
  tone: string;
  length: number;
  priorOutreachContext?: string;
};

export class GenerationPreflightError extends Error {
  code: string;
  retryAfter?: number;
  constructor(code: string, message: string, retryAfter?: number) {
    super(message);
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

async function currentApprovedProfile(userId: string) {
  const profile = (
    await db.select().from(candidateProfiles).where(eq(candidateProfiles.userId, userId)).limit(1)
  )[0];
  if (!profile?.currentRevisionId) return null;
  const revision = (
    await db
      .select()
      .from(candidateProfileRevisions)
      .where(eq(candidateProfileRevisions.id, profile.currentRevisionId))
      .limit(1)
  )[0];
  if (!revision?.approvedAt) return null;
  const facts = await db
    .select({ id: candidateFacts.id, factType: candidateFacts.factType, text: candidateFacts.text })
    .from(candidateFacts)
    .where(and(eq(candidateFacts.profileRevisionId, revision.id), eq(candidateFacts.approved, true)));
  return { revision, facts };
}

export async function startGeneration(params: {
  userId: string;
  draftId: string;
  input: GenerationStartInput;
  idempotencyKey: string;
}): Promise<{ generationId: string; state: string }> {
  const config = getConfig();
  if (!config.FEATURE_AI_ENABLED) {
    throw new GenerationPreflightError("AI_DISABLED", "AI generation is temporarily unavailable. Manual writing still works.");
  }

  // Preflight: authoritative credit availability (not client state).
  const balances = await getBalances(params.userId);
  if (balances.ai.available < 1) {
    throw new GenerationPreflightError("INSUFFICIENT_AI_CREDITS", "You need one AI generation credit to continue.");
  }

  // Rate limits: 5/min, 30/hour, 2 concurrent (§22.2).
  const opSeed = `${params.userId}:${params.draftId}:${params.idempotencyKey}`;
  const minuteAdmission = await admitWithPreCheck({ policy: LIMITS.aiGenerate, principal: params.userId, operationRef: `genmin:${opSeed}` });
  if (!minuteAdmission.admitted) {
    throw new GenerationPreflightError("RATE_LIMITED", "Too many generation requests. Please wait a minute.", LIMITS.aiGenerate.windowSeconds);
  }
  const hourAdmission = await admitWithPreCheck({ policy: LIMITS.aiGenerateHour, principal: params.userId, operationRef: `genhour:${opSeed}` });
  if (!hourAdmission.admitted) {
    throw new GenerationPreflightError("RATE_LIMITED", "You've reached the hourly AI limit. Please try later.", LIMITS.aiGenerateHour.windowSeconds);
  }

  // Draft must exist, belong to user, have a recipient, and be stable.
  const draft = (
    await db
      .select()
      .from(drafts)
      .where(and(eq(drafts.id, params.draftId), eq(drafts.userId, params.userId)))
      .limit(1)
  )[0];
  if (!draft) throw new GenerationPreflightError("DRAFT_NOT_FOUND", "This draft no longer exists.");

  // Self-heal a draft abandoned in "generating". The status is set when a
  // generation is queued and only cleared by the job handler on a terminal
  // outcome. If the job exhausts its attempts (or the worker dies), nothing
  // clears it — and since the preflight below rejects anything not "active",
  // two failed provider calls would permanently lock the user out of their own
  // draft with no way to recover. Release the editor when nothing is actually
  // working on it; the orphaned credit is returned by the credits.reconcile
  // sweeper once its reservation deadline passes.
  let draftStatus = draft.status;
  if (draftStatus === "generating") {
    const live = await db.execute(sql`
      SELECT 1 FROM jobs
      WHERE kind = 'draft.generate'
        AND entity_id IN (SELECT id::text FROM generation_requests WHERE draft_id = ${params.draftId}::uuid)
        AND state IN ('queued','running','retry_wait','deferred')
      LIMIT 1
    `);
    if (live.rows.length === 0) {
      await db.update(drafts).set({ status: "active" }).where(eq(drafts.id, params.draftId));
      logger.info("generation.abandoned_draft_released", { draftId: params.draftId, userId: params.userId });
      draftStatus = "active";
    }
  }
  if (draftStatus !== "active") {
    throw new GenerationPreflightError("DRAFT_INACTIVE", "This draft can no longer be edited.");
  }
  if (!draft.contactId && !draft.ownRecipientEmail) {
    throw new GenerationPreflightError("NO_RECIPIENT", "Choose a recipient before generating.");
  }

  const profile = await currentApprovedProfile(params.userId);
  if (!profile || profile.facts.length === 0) {
    throw new GenerationPreflightError(
      "NO_CONFIRMED_FACTS",
      "Confirm a few profile facts first — AI drafts are written only from details you have confirmed.",
    );
  }

  // Hard daily ceiling: 10 drafts per day, independent of balance. One credit
  // buys one draft, so this also bounds how quickly a large balance can be
  // spent on model calls. The quota window is a fixed UTC bucket (the admissions
  // table keys on window_start), so it resets at midnight UTC.
  //
  // Deliberately placed AFTER the deterministic preflight checks above. The
  // daily budget is a user-visible quota, so it must only be spent on an
  // attempt that would really have started a generation — otherwise clicking
  // "Generate" before choosing a recipient burned a slot and still errored.
  const dayAdmission = await admitWithPreCheck({
    policy: LIMITS.aiGenerateDaily,
    principal: params.userId,
    operationRef: `genday:${opSeed}`,
  });
  if (!dayAdmission.admitted) {
    throw new GenerationPreflightError(
      "DAILY_LIMIT_REACHED",
      "You've used all 10 AI drafts for today. Your copilot credits are safe — the limit resets at midnight UTC, or buy a pack for more.",
      LIMITS.aiGenerateDaily.windowSeconds,
    );
  }

  const outcome = await withIdempotency<{ generationId: string; state: string }>({
    actorId: params.userId,
    scope: "draft.generation",
    key: params.idempotencyKey,
    requestHash: hashRequest({ draftId: params.draftId, input: params.input }),
    run: async (operationRef) => {
      // Candidate name for salutation (safe metadata).
      const nameRow = await db.execute(sql`SELECT display_name FROM users WHERE id = ${params.userId}::uuid`);
      const candidateName = ((nameRow.rows[0] as { display_name: string | null })?.display_name ?? "").slice(0, 120);

      // Reservation + generation request + job + outbox in ONE transaction.
      const generationId = await db.transaction(async (tx) => {
        const gen = (
          await tx
            .insert(generationRequests)
            .values({
              userId: params.userId,
              draftId: params.draftId,
              mode: draft.mode === "agentic" ? "agentic" : "quick_ai",
              intent: params.input.intent,
              baseVersion: draft.currentVersion,
              inputSnapshot: {
                draftId: params.draftId,
                intent: params.input.intent,
                targetRole: params.input.targetRole,
                jobDescription: params.input.jobDescription?.slice(0, 20_000),
                tone: params.input.tone,
                length: params.input.length,
                contactId: draft.contactId,
                ownRecipientName: draft.ownRecipientName,
                ownRecipientEmail: draft.ownRecipientEmail,
                profileRevisionId: profile.revision.id,
                candidateName,
                priorOutreachContext: params.input.priorOutreachContext,
              },
              inputHash: hashRequest(params.input),
              promptVersion: config.AI_PROMPT_VERSION,
              state: "reserved",
            })
            .returning({ id: generationRequests.id })
        )[0]!;

        await tx.execute(sql`SELECT reserve_generation(${params.userId}::uuid, ${gen.id}::text, 1)`);
        await tx.update(drafts).set({ status: "generating" }).where(eq(drafts.id, params.draftId));

        await enqueueJob({
          kind: "draft.generate",
          userId: params.userId,
          entityId: gen.id,
          // Retries are free for the user: the credit is only consumed once a
          // validated artifact is committed, so transient provider failures
          // should be retried rather than surfaced as a failed draft.
          maxAttempts: 4,
          deadlineSeconds: 300,
          tx,
        });
        return gen.id;
      });
      return { generationId, state: "queued" };
    },
  });

  if (outcome.kind === "conflict") {
    throw new GenerationPreflightError("IDEMPOTENCY_CONFLICT", "This generation request was already used with different inputs.");
  }
  if (outcome.kind === "new") return outcome.result;
  const meta = outcome.kind === "replay" ? outcome.responseMeta : null;
  if (meta) return meta;
  throw new GenerationPreflightError("INTERNAL", "Generation could not be started.");
}

export async function getGenerationStatus(userId: string, generationId: string) {
  const gen = (
    await db
      .select()
      .from(generationRequests)
      .where(and(eq(generationRequests.id, generationId), eq(generationRequests.userId, userId)))
      .limit(1)
  )[0];
  if (!gen) return null;
  let proposal: { subject: string; body: string } | null = null;
  if (gen.proposedRevisionId) {
    const { draftRevisions } = await import("@/db/schema");
    const rev = (
      await db.select().from(draftRevisions).where(eq(draftRevisions.id, gen.proposedRevisionId)).limit(1)
    )[0];
    if (rev) proposal = { subject: rev.subject, body: rev.body };
  }
  return {
    id: gen.id,
    state: gen.state,
    mode: gen.mode,
    acceptanceState: gen.acceptanceState,
    proposedRevisionId: gen.proposedRevisionId,
    proposal,
    failureCode: gen.failureCode,
    failureMessage: gen.failureMessage,
    createdAt: gen.createdAt,
    completedAt: gen.completedAt,
    usage: gen.usage,
  };
}

export async function cancelGeneration(userId: string, generationId: string): Promise<{ cancelled: boolean; state: string }> {
  const gen = (
    await db
      .select()
      .from(generationRequests)
      .where(and(eq(generationRequests.id, generationId), eq(generationRequests.userId, userId)))
      .limit(1)
  )[0];
  if (!gen) throw new GenerationPreflightError("GENERATION_NOT_FOUND", "Generation not found.");

  // State-aware cancel (§20): only before external model response can we stop
  // delivery and release; a late response cannot revive a cancelled charge.
  if (["reserved", "queued", "preparing"].includes(gen.state)) {
    const { releaseGeneration } = await import("@/server/services/credits");
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(generationRequests)
        .set({ state: "cancelled", completedAt: new Date() })
        .where(and(eq(generationRequests.id, generationId), sql`state IN ('reserved','queued','preparing')`))
        .returning({ id: generationRequests.id });
      if (updated.length === 0) return;
      await tx.execute(sql`UPDATE drafts SET status = 'active' WHERE id = ${gen.draftId}::uuid AND status = 'generating'`);
      await tx.execute(sql`UPDATE jobs SET state = 'cancelled' WHERE kind = 'draft.generate' AND entity_id = ${generationId}::uuid AND state IN ('queued','retry_wait','deferred')`);
    });
    await releaseGeneration(generationId).catch(() => {});
    return { cancelled: true, state: "cancelled" };
  }
  return { cancelled: false, state: gen.state };
}

export async function releaseGenerationSlot(userId: string, generationId: string) {
  await releaseSlot(`ai:user:${userId}:${generationId}`);
}

export { CreditError, logger };
