import "server-only";
import { and, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/db/client";
import { candidateFacts, candidateProfileRevisions, candidateProfiles, resumes, uploadIntents, users, userPreferences } from "@/db/schema";
import { getConfig } from "@/server/config";
import { sha256Hex } from "@/server/crypto";
import { getObjectStore } from "@/server/adapters/objectStore";
import { admitWithPreCheck, LIMITS } from "@/server/adapters/ratelimit";
import { enqueueJob } from "@/server/services/jobs";
import { profileRevisionSchema } from "@/lib/validation";
import { logger } from "@/server/logger";

/**
 * Resume + candidate profile service (§14). PDF only, 5 MiB max; bytes are
 * validated (not names/MIME headers); quarantine → immutable clean key.
 */

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const MAX_PAGES = 10;

/** HTTP status per upload error code — the single owner of this mapping (§19.1). */
const UPLOAD_STATUS: Record<string, number> = {
  RATE_LIMITED: 429,
  QUOTA_EXCEEDED: 409,
  UPLOADS_DISABLED: 503,
};

export class UploadError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
  apiErrorSpec() {
    return { status: UPLOAD_STATUS[this.code] ?? 400, code: this.code, message: this.message };
  }
}

export async function createUploadIntent(userId: string): Promise<{ uploadIntentId: string; expiresAt: Date; maxBytes: number }> {
  const config = getConfig();
  if (!config.FEATURE_RESUME_ATTACHMENTS_ENABLED) {
    throw new UploadError("UPLOADS_DISABLED", "Resume uploads are temporarily unavailable. You can enter your profile manually.");
  }
  const admission = await admitWithPreCheck({ policy: LIMITS.uploadIntent, principal: userId, operationRef: `upload:${userId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}` });
  if (!admission.admitted) throw new UploadError("RATE_LIMITED", "Too many upload attempts. Please wait a few minutes.");

  // Active clean resumes capped at 3 (§14.1).
  const active = await db.execute(sql`
    SELECT count(*) AS c FROM resumes WHERE user_id = ${userId}::uuid AND state NOT IN ('deleted','deleting','failed','scanning_rejected')
  `);
  if (Number((active.rows[0] as { c: string }).c) >= 3) {
    throw new UploadError("QUOTA_EXCEEDED", "You already have three active resumes. Delete one before uploading another.");
  }

  const intent = (
    await db
      .insert(uploadIntents)
      .values({
        userId,
        kind: "resume",
        objectKey: `quarantine/${userId}/${crypto.randomUUID()}.pdf`,
        maxBytes: MAX_RESUME_BYTES,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      })
      .returning({ id: uploadIntents.id, expiresAt: uploadIntents.expiresAt })
  )[0]!;
  return { uploadIntentId: intent.id, expiresAt: intent.expiresAt, maxBytes: MAX_RESUME_BYTES };
}

/** Structural PDF validation — names and MIME headers are not proof (§14.2). */
export function validatePdfStructure(bytes: Uint8Array): { ok: boolean; reason?: string; pageCount?: number } {
  const header = Buffer.from(bytes.slice(0, 8)).toString("latin1");
  if (!header.startsWith("%PDF-")) return { ok: false, reason: "not_a_pdf" };
  const tail = Buffer.from(bytes.slice(Math.max(0, bytes.length - 2048))).toString("latin1");
  if (!tail.includes("%%EOF")) return { ok: false, reason: "truncated_pdf" };
  const text = Buffer.from(bytes).toString("latin1");
  if (text.includes("/Encrypt")) return { ok: false, reason: "encrypted_pdf" };
  const pages = (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  if (pages === 0) return { ok: false, reason: "no_pages" };
  if (pages > MAX_PAGES) return { ok: false, reason: "too_many_pages" };
  return { ok: true, pageCount: pages };
}

export async function finalizeUpload(params: {
  userId: string;
  uploadIntentId: string;
  bytes: Uint8Array;
  displayFilename: string;
}): Promise<{ resumeId: string }> {
  const intent = (
    await db
      .select()
      .from(uploadIntents)
      .where(and(eq(uploadIntents.id, params.uploadIntentId), eq(uploadIntents.userId, params.userId)))
      .limit(1)
  )[0];
  if (!intent || intent.state === "finalized") {
    throw new UploadError("INTENT_INVALID", "This upload link has expired. Start again.");
  }
  if (intent.expiresAt.getTime() < Date.now()) throw new UploadError("INTENT_EXPIRED", "This upload link has expired. Start again.");

  // Server verifies actual stored size/type — never the client claim (§14.2).
  if (params.bytes.length === 0) throw new UploadError("EMPTY_FILE", "The file is empty.");
  if (params.bytes.length > intent.maxBytes) {
    throw new UploadError("FILE_TOO_LARGE", "The file is larger than 5 MiB. Upload a smaller PDF or add your experience manually.");
  }
  const structure = validatePdfStructure(params.bytes);
  if (!structure.ok) {
    throw new UploadError(
      structure.reason === "encrypted_pdf" ? "ENCRYPTED_PDF" : "INVALID_PDF",
      "This file isn't a readable PDF (it may be password-protected or corrupted). Export it as a standard PDF and try again.",
    );
  }

  // Claim the intent only once the file is known to be acceptable, and claim it
  // atomically. This used to check state, then store and insert with no
  // transaction and no claim, so a double-submitted upload (double click, a
  // retry, two tabs) created two resume rows from one intent and burned two of
  // the user's three active slots. Claiming after validation also means a
  // rejected file does not consume the user's upload link.
  const claimed = await db
    .update(uploadIntents)
    .set({ state: "finalized", finalizedAt: new Date() })
    .where(
      and(
        eq(uploadIntents.id, params.uploadIntentId),
        eq(uploadIntents.userId, params.userId),
        sql`${uploadIntents.state} <> 'finalized'`,
      ),
    )
    .returning({ id: uploadIntents.id });
  if (claimed.length === 0) {
    throw new UploadError("INTENT_INVALID", "This upload link has already been used. Start again.");
  }

  const store = getObjectStore("quarantine");
  // If anything from here fails, release the claim so the user can retry the
  // same upload instead of being told the link expired because of a transient
  // storage error.
  try {
    const metadata = await store.put(intent.objectKey, params.bytes, "application/pdf");

    const resume = (
      await db
        .insert(resumes)
        .values({
          userId: params.userId,
          objectKey: intent.objectKey,
          displayFilename: params.displayFilename.replace(/[/\\:*?"<>|\r\n\x00-\x1f]/g, "_").slice(0, 200),
          byteSize: metadata.byteSize,
          sha256: metadata.sha256,
          pageCount: structure.pageCount ?? null,
          state: "uploaded",
        })
        .returning({ id: resumes.id })
    )[0]!;

    await enqueueJob({ kind: "resume.scan_parse", userId: params.userId, entityId: resume.id, maxAttempts: 3, deadlineSeconds: 300 });
    return { resumeId: resume.id };
  } catch (err) {
    await db
      .update(uploadIntents)
      .set({ state: "pending", finalizedAt: null })
      .where(and(eq(uploadIntents.id, intent.id), eq(uploadIntents.userId, params.userId)))
      .catch(() => {});
    throw err;
  }
}

export async function listResumes(userId: string) {
  return db
    .select({
      id: resumes.id,
      displayFilename: resumes.displayFilename,
      byteSize: resumes.byteSize,
      pageCount: resumes.pageCount,
      state: resumes.state,
      scanStatus: resumes.scanStatus,
      scanNote: resumes.scanNote,
      parseState: resumes.parseState,
      createdAt: resumes.createdAt,
    })
    .from(resumes)
    .where(and(eq(resumes.userId, userId), sql`state <> 'deleted'`))
    .orderBy(desc(resumes.createdAt));
}

export async function getResume(userId: string, resumeId: string) {
  const rows = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function deleteResume(userId: string, resumeId: string): Promise<void> {
  const resume = (await db.select().from(resumes).where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId))).limit(1))[0];
  if (!resume) return;
  await db.update(resumes).set({ state: "deleted", deletedAt: new Date(), updatedAt: new Date() }).where(eq(resumes.id, resumeId));
  const store = resume.objectKey.startsWith("clean/") ? getObjectStore("clean") : getObjectStore("quarantine");
  await store.delete(resume.objectKey);
}

/* ------------------------------------------------------------------ */
/* Candidate profile                                                   */
/* ------------------------------------------------------------------ */

export async function getProfileForUser(userId: string) {
  const profile = (await db.select().from(candidateProfiles).where(eq(candidateProfiles.userId, userId)).limit(1))[0];
  if (!profile?.currentRevisionId) {
    return { profile: null, revision: null, facts: [] };
  }
  const revision = (await db.select().from(candidateProfileRevisions).where(eq(candidateProfileRevisions.id, profile.currentRevisionId)).limit(1))[0];
  const facts = revision
    ? await db.select().from(candidateFacts).where(eq(candidateFacts.profileRevisionId, revision.id)).orderBy(candidateFacts.sortOrder)
    : [];
  return { profile, revision: revision ?? null, facts };
}

export async function getReviewableProfile(userId: string) {
  // Latest revision (approved or pending review) with its facts.
  const profile = (await db.select().from(candidateProfiles).where(eq(candidateProfiles.userId, userId)).limit(1))[0];
  if (!profile) return null;
  const latest = (
    await db
      .select()
      .from(candidateProfileRevisions)
      .where(eq(candidateProfileRevisions.profileId, profile.id))
      .orderBy(desc(candidateProfileRevisions.revisionNo))
      .limit(1)
  )[0];
  if (!latest) return null;
  const facts = await db.select().from(candidateFacts).where(eq(candidateFacts.profileRevisionId, latest.id)).orderBy(candidateFacts.sortOrder);
  return { profile, revision: latest, facts };
}

/**
 * Candidate correction/manual facts → immutable approved revision (§17.3).
 * Facts are marked usable only after user confirmation (§14.2 step 12).
 */
export async function saveProfileRevision(params: {
  userId: string;
  input: z.infer<typeof profileRevisionSchema>;
}): Promise<{ revisionId: string; revisionNo: number }> {
  const profileRow = (await db.select().from(candidateProfiles).where(eq(candidateProfiles.userId, params.userId)).limit(1))[0];
  let profileId = profileRow?.id;
  if (!profileId) {
    const created = (await db.insert(candidateProfiles).values({ userId: params.userId }).returning({ id: candidateProfiles.id }))[0]!;
    profileId = created.id;
  }
  const maxRow = await db.execute(sql`SELECT COALESCE(MAX(revision_no), 0) + 1 AS next FROM candidate_profile_revisions WHERE profile_id = ${profileId}::uuid`);
  const nextNo = Number((maxRow.rows[0] as { next: number }).next);

  const revisionId = await db.transaction(async (tx) => {
    const inserted = (
      await tx
        .insert(candidateProfileRevisions)
        .values({
          userId: params.userId,
          profileId: profileId!,
          revisionNo: nextNo,
          source: "manual",
          extracted: { summary: params.input.summary ?? null, targetRole: params.input.targetRole ?? null, careerStage: params.input.careerStage ?? null },
          contentHash: sha256Hex(JSON.stringify(params.input.facts)).slice(0, 32),
          approvedAt: params.input.approve ? new Date() : null,
        })
        .returning({ id: candidateProfileRevisions.id })
    )[0]!;
    let order = 0;
    for (const fact of params.input.facts) {
      await tx.insert(candidateFacts).values({
        profileRevisionId: inserted.id,
        userId: params.userId,
        factType: fact.factType,
        text: fact.text,
        numericValue: fact.numericValue ?? null,
        unit: fact.unit ?? null,
        approved: params.input.approve,
        sortOrder: order++,
      });
    }
    await tx.update(candidateProfiles).set({ currentRevisionId: inserted.id, updatedAt: new Date() }).where(eq(candidateProfiles.id, profileId!));
    return inserted.id;
  });
  return { revisionId, revisionNo: nextNo };
}

/**
 * Confirm a revision's facts and make it the one AI drafting reads from.
 *
 * `factIds` selects a subset. Ids are matched against this revision's own facts,
 * so a payload naming someone else's fact cannot flip it, and facts left out are
 * explicitly un-approved rather than silently kept.
 */
export async function approveProfileRevision(userId: string, revisionId: string, factIds?: string[]): Promise<void> {
  const profile = (await db.select().from(candidateProfiles).where(eq(candidateProfiles.userId, userId)).limit(1))[0];
  if (!profile) return;
  await db.transaction(async (tx) => {
    if (factIds) {
      const owned = await tx
        .select({ id: candidateFacts.id })
        .from(candidateFacts)
        .where(and(eq(candidateFacts.profileRevisionId, revisionId), eq(candidateFacts.userId, userId)));
      const wanted = new Set(factIds);
      const toApprove = owned.map((r) => r.id).filter((id) => wanted.has(id));
      if (toApprove.length === 0) throw new Error("NO_FACTS_TO_APPROVE");
      await tx
        .update(candidateFacts)
        .set({ approved: true })
        .where(and(eq(candidateFacts.profileRevisionId, revisionId), inArray(candidateFacts.id, toApprove)));
      await tx
        .update(candidateFacts)
        .set({ approved: false })
        .where(and(eq(candidateFacts.profileRevisionId, revisionId), notInArray(candidateFacts.id, toApprove)));
    } else {
      await tx
        .update(candidateFacts)
        .set({ approved: true })
        .where(and(eq(candidateFacts.profileRevisionId, revisionId), eq(candidateFacts.userId, userId)));
    }
    await tx
      .update(candidateProfileRevisions)
      .set({ approvedAt: new Date() })
      .where(and(eq(candidateProfileRevisions.id, revisionId), eq(candidateProfileRevisions.userId, userId)));
    await tx.update(candidateProfiles).set({ currentRevisionId: revisionId, updatedAt: new Date() }).where(eq(candidateProfiles.id, profile.id));
  });
}

/**
 * Whether AI drafting is unlocked for this user.
 *
 * An approved revision with zero facts is NOT enough: startGeneration requires
 * at least one confirmed fact (NO_CONFIRMED_FACTS), and onboarding creates an
 * empty approved revision. Checking the same condition here keeps the composer
 * button and the server rule in agreement, so users get a disabled button with
 * guidance instead of an error after clicking.
 */
export async function hasApprovedProfile(userId: string): Promise<boolean> {
  const profile = (await db.select().from(candidateProfiles).where(eq(candidateProfiles.userId, userId)).limit(1))[0];
  if (!profile?.currentRevisionId) return false;
  const revision = (await db.select().from(candidateProfileRevisions).where(eq(candidateProfileRevisions.id, profile.currentRevisionId)).limit(1))[0];
  if (!revision?.approvedAt) return false;
  const facts = await db
    .select({ id: candidateFacts.id })
    .from(candidateFacts)
    .where(and(eq(candidateFacts.profileRevisionId, revision.id), eq(candidateFacts.approved, true)))
    .limit(1);
  return facts.length > 0;
}

/**
 * A newer revision the user has not confirmed yet — typically what a resume just
 * parsed into. Parse inserts its facts unapproved and moves only `activeResumeId`,
 * never `currentRevisionId`, so AI keeps drafting from the older profile while the
 * user believes the new resume is in use. Nothing told them; this is that signal.
 */
export async function getPendingProfileReview(
  userId: string,
): Promise<{ revisionId: string; revisionNo: number; factCount: number } | null> {
  const profile = (await db.select().from(candidateProfiles).where(eq(candidateProfiles.userId, userId)).limit(1))[0];
  if (!profile) return null;
  const rows = await db
    .select({
      id: candidateProfileRevisions.id,
      revisionNo: candidateProfileRevisions.revisionNo,
      approvedAt: candidateProfileRevisions.approvedAt,
      factCount: sql<number>`(
        SELECT count(*)::int FROM candidate_facts f
        WHERE f.profile_revision_id = ${candidateProfileRevisions.id} AND f.approved = false
      )`,
    })
    .from(candidateProfileRevisions)
    .where(and(eq(candidateProfileRevisions.userId, userId), sql`${candidateProfileRevisions.approvedAt} IS NULL`))
    .orderBy(desc(candidateProfileRevisions.revisionNo));
  for (const row of rows) {
    if (row.id === profile.currentRevisionId) continue;
    if (row.factCount > 0) return { revisionId: row.id, revisionNo: row.revisionNo, factCount: row.factCount };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Preferences / user                                                  */
/* ------------------------------------------------------------------ */

export async function updatePreferences(userId: string, patch: Partial<{ displayName: string; timezone: string; careerStage: string; defaultMode: string; targetRoles: string[]; targetLocations: string[]; notifyReminders: boolean; notifyProduct: boolean; dailyDigestEnabled: boolean }>) {
  if (patch.displayName !== undefined) {
    await db.update(users).set({ displayName: patch.displayName.slice(0, 120), updatedAt: new Date() }).where(eq(users.id, userId));
  }
  const prefPatch: Record<string, unknown> = {};
  if (patch.timezone !== undefined) prefPatch.timezone = patch.timezone.slice(0, 60);
  if (patch.careerStage !== undefined) prefPatch.careerStage = patch.careerStage;
  if (patch.defaultMode !== undefined) prefPatch.defaultMode = patch.defaultMode;
  if (patch.targetRoles !== undefined) prefPatch.targetRoles = patch.targetRoles.slice(0, 10);
  if (patch.targetLocations !== undefined) prefPatch.targetLocations = patch.targetLocations.slice(0, 10);
  if (patch.notifyReminders !== undefined) prefPatch.notifyReminders = patch.notifyReminders;
  if (patch.notifyProduct !== undefined) prefPatch.notifyProduct = patch.notifyProduct;
  if (patch.dailyDigestEnabled !== undefined) prefPatch.dailyDigestEnabled = patch.dailyDigestEnabled;
  if (Object.keys(prefPatch).length > 0) {
    await db.update(userPreferences).set(prefPatch).where(eq(userPreferences.userId, userId));
  }
}

export async function getPreferences(userId: string) {
  const user = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  const prefs = (await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1))[0];
  return { user, prefs };
}

export async function setOnboardingStep(userId: string, step: string, done?: boolean) {
  await db
    .update(users)
    .set({ onboardingStep: step, ...(done ? { onboardedAt: new Date() } : {}), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export { logger };
