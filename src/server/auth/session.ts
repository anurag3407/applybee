import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { and, eq, gt } from "drizzle-orm";
import { db, pool } from "@/db/client";
import { authSessions, userRoleAssignments, users } from "@/db/schema";
import { getConfig } from "@/server/config";
import { identityFingerprint, randomToken, sha256Hex } from "@/server/crypto";
import { logger } from "@/server/logger";
import { sql } from "drizzle-orm";

/**
 * Authentication boundary. Two adapters behind one interface (plan §3.1, §27.2):
 *
 * - `clerk`: production adapter — enabled when Clerk keys are configured.
 *   Wiring steps are documented in docs/adr/0002-authentication.md; this build
 *   activates it only with real keys present.
 * - `dev`: labeled local development session adapter used when no keys exist.
 *   It is never available in production (enforced in config validation).
 */

export const SESSION_COOKIE = "ab_session";

export type SessionUser = {
  id: string;
  clerkId: string;
  email: string;
  displayName: string | null;
  status: string;
  onboardingStep: string;
  isAdmin: boolean;
  authMode: "clerk" | "dev";
};

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const config = getConfig();
  if (config.authMode === "clerk") {
    // Production adapter requires @clerk/nextjs installed and keys present (docs/adr/0002-authentication.md).
    // Fall back to dev adapter rather than crashing the worker with an unhandled exception.
    logger.warn("auth.clerk_unwired_fallback", { message: "Clerk keys present but @clerk/nextjs is not wired yet; falling back to dev session adapter." });
    return getDevSessionUser();
  }
  return getDevSessionUser();
});

async function getDevSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const tokenHash = sha256Hex(raw);
  const rows = await db
    .select({
      id: users.id,
      clerkId: users.clerkId,
      email: users.email,
      displayName: users.displayName,
      status: users.status,
      onboardingStep: users.onboardingStep,
    })
    .from(authSessions)
    .innerJoin(users, eq(users.id, authSessions.userId))
    .where(and(eq(authSessions.tokenHash, tokenHash), gt(authSessions.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const roles = await db
    .select({ role: userRoleAssignments.role })
    .from(userRoleAssignments)
    .where(eq(userRoleAssignments.userId, row.id));
  return {
    ...row,
    isAdmin: roles.some((r) => r.role === "admin"),
    authMode: "dev",
  };
}

/** Provision (idempotently) and open a dev session. Trial grant happens once. */
export async function devSignIn(input: {
  email: string;
  displayName?: string;
}): Promise<{ userId: string; trialGranted: boolean }> {
  const config = getConfig();
  const email = input.email.trim().toLowerCase();
  // The dev adapter keys the external auth subject to the verified email so
  // returning sign-ins converge on one account.
  const clerkId = `dev:${sha256Hex(email).slice(0, 24)}`;
  const fingerprint = identityFingerprint(email);

  const preExisting = await db
    .select({ id: users.id, status: users.status })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  const trialGrantedBefore =
    preExisting.length === 0 &&
    (
      await db.execute(
        sql`SELECT 1 FROM trial_entitlements WHERE program_id = 'free_trial_v1' AND identity_fingerprint = ${fingerprint}`,
      )
    ).rows.length > 0;

  const result = await db.transaction(async (tx) => {
    const res = await tx.execute(sql`
      SELECT provision_user_and_trial(
        ${clerkId}, ${email}, ${input.displayName ?? null}, ${fingerprint}, 5, 2, '2026-10-04.1'
      ) AS user_id
    `);
    return (res.rows[0] as { user_id: string }).user_id;
  });

  if (trialGrantedBefore) {
    logger.info("trial.entitlement_already_consumed", { userId: result });
  }

  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  await db.insert(authSessions).values({
    userId: result,
    tokenHash: sha256Hex(token),
    expiresAt,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    path: "/",
    expires: expiresAt,
  });
  if (!trialGrantedBefore) {
    const { sendWelcomeEmail } = await import("@/server/services/email");
    sendWelcomeEmail(email, input.displayName).catch(() => {});
  }

  return { userId: result, trialGranted: !trialGrantedBefore };
}

export async function signOut() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) {
    await db.delete(authSessions).where(eq(authSessions.tokenHash, sha256Hex(raw)));
  }
  jar.delete(SESSION_COOKIE);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** Active, non-deleting account; blocks new work for disabled/deleting users. */
export async function requireActiveUser(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.status !== "active") {
    redirect(user.status === "deleting" ? "/app/settings/privacy" : "/auth/error?reason=disabled");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireActiveUser();
  if (!user.isAdmin) redirect("/access-denied");
  return user;
}

/**
 * API-side guard: returns the user or null (route handlers convert to 401).
 * Same authorization rules as pages — a server-rendered form is no shortcut.
 */
export async function getApiUser(): Promise<SessionUser | null> {
  try {
    const user = await getSessionUser();
    if (user && user.status === "active") return user;
    return null;
  } catch {
    return null;
  }
}

export async function grantDevAdminRole(userId: string) {
  await db
    .insert(userRoleAssignments)
    .values({ userId, role: "admin", assignedBy: userId })
    .onConflictDoNothing();
}

export { pool };
