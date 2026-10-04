import "server-only";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { creditAccounts, userPreferences, users } from "@/db/schema";
import { identityFingerprint } from "@/server/crypto";
import { logger } from "@/server/logger";
import { getTrialAllowance } from "@/server/services/catalog";

/** Fallback only used when the catalog cannot be read (never for a live site). */
const FALLBACK_TRIAL = { contact: 5, ai: 2 };

/**
 * Provisioning service — the single convergence point for first-request and
 * webhook provisioning (§17.2). Wraps the audited SQL function.
 *
 * The trial quantities come from the published catalog so the marketing site
 * and the actual grant cannot disagree. They were previously hardcoded here and
 * in the dev sign-in path, which meant an operator editing the catalog's trial
 * pack changed what the site advertised without changing what users received.
 */
export async function provisionUserAndTrial(params: {
  clerkId: string;
  email: string;
  displayName: string | null;
  fingerprint: string;
}): Promise<string> {
  const trial = (await getTrialAllowance().catch(() => null)) ?? FALLBACK_TRIAL;
  const result = await db.transaction(async (tx) => {
    const res = await tx.execute(sql`
      SELECT provision_user_and_trial(
        ${params.clerkId}, ${params.email}, ${params.displayName}, ${params.fingerprint},
        ${trial.contact}, ${trial.ai}, '2026-10-04.1'
      ) AS user_id
    `);
    return (res.rows[0] as { user_id: string }).user_id;
  });
  logger.info("user.provisioned", { userId: result, contactCredits: trial.contact, aiCredits: trial.ai });
  return result;
}

export async function getTrialStatus(userId: string): Promise<{ granted: boolean }> {
  const grants = await db.execute(sql`SELECT 1 FROM trial_grants WHERE user_id = ${userId}::uuid`);
  return { granted: grants.rows.length > 0 };
}

export async function ensureUserDefaults(userId: string) {
  await db.insert(userPreferences).values({ userId }).onConflictDoNothing();
  await db.insert(creditAccounts).values({ userId, type: "contact" }).onConflictDoNothing();
  await db.insert(creditAccounts).values({ userId, type: "ai" }).onConflictDoNothing();
}

export async function markOnboarded(userId: string) {
  await db.update(users).set({ onboardedAt: new Date() }).where(eq(users.id, userId));
}

export { identityFingerprint, eq };
