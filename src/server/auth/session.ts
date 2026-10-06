import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { and, eq, gt, sql } from "drizzle-orm";
import { db, pool } from "@/db/client";
import { authSessions, userRoleAssignments, users } from "@/db/schema";
import { getConfig } from "@/server/config";
import { identityFingerprint, randomToken, sha256Hex } from "@/server/crypto";
import { logger } from "@/server/logger";
import { provisionUserAndTrial } from "@/server/services/provisioning";

/**
 * Authentication boundary. Two adapters behind one interface (plan §3.1, §27.2):
 *
 * - `clerk`: production adapter — enabled when Clerk keys are configured.
 *   Wired through `clerkMiddleware()` (src/proxy.ts), `ClerkProvider`
 *   (src/app/layout.tsx), and `auth()`; see docs/adr/0001-platform.md.
 * - `dev`: labeled local development session adapter used when no keys exist.
 *   It is never available in production (enforced by the dev-signin route and
 *   by only being consulted when `authMode === "dev"`).
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

type SessionUserRow = Pick<
  SessionUser,
  "id" | "clerkId" | "email" | "displayName" | "status" | "onboardingStep"
>;

const userColumns = {
  id: users.id,
  clerkId: users.clerkId,
  email: users.email,
  displayName: users.displayName,
  status: users.status,
  onboardingStep: users.onboardingStep,
} as const;

async function withRoles(row: SessionUserRow, authMode: "clerk" | "dev"): Promise<SessionUser> {
  const roles = await db
    .select({ role: userRoleAssignments.role })
    .from(userRoleAssignments)
    .where(eq(userRoleAssignments.userId, row.id));
  return {
    ...row,
    isAdmin: roles.some((r) => r.role === "admin"),
    authMode,
  };
}

async function selectUserByClerkId(clerkId: string): Promise<SessionUserRow | null> {
  const rows = await db.select(userColumns).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return rows[0] ?? null;
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const config = getConfig();

  // Exactly one adapter is active per deployment. The local cookie must never
  // authenticate against a Clerk deployment: only consult it when the dev
  // adapter is the configured one.
  if (config.authMode === "dev") {
    return getDevSessionUser();
  }

  // Clerk session (Google OAuth and Clerk-hosted credentials). `auth()` reads
  // the request state set by `clerkMiddleware` in src/proxy.ts.
  try {
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) return null;

    let row = await selectUserByClerkId(userId);
    if (!row) {
      const clerkUser = await currentUser();
      // Use the primary email, not whichever address happens to be first.
      const email =
        clerkUser?.primaryEmailAddress?.emailAddress ??
        clerkUser?.emailAddresses?.[0]?.emailAddress ??
        `${userId}@accounts.clerk.dev`;
      const displayName = clerkUser
        ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null
        : null;

      // First authenticated request provisions the account; the Clerk webhook
      // converges on the same service so one user/trial is granted (§17.2).
      await provisionUserAndTrial({
        clerkId: userId,
        email,
        displayName,
        fingerprint: identityFingerprint(email),
      });

      row = await selectUserByClerkId(userId);
    }

    if (!row) return null;
    return withRoles(row, "clerk");
  } catch (err) {
    logger.warn("auth.clerk_session_check_failed", { error: String(err) });
    return null;
  }
});

async function getDevSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const tokenHash = sha256Hex(raw);
  const rows = await db
    .select(userColumns)
    .from(authSessions)
    .innerJoin(users, eq(users.id, authSessions.userId))
    .where(and(eq(authSessions.tokenHash, tokenHash), gt(authSessions.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return withRoles(row, "dev");
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
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  const isNewAccount = preExisting.length === 0;
  // A new auth subject can still reuse an identity whose trial was already
  // consumed (delete + re-register); returning users keep their own account.
  const identityAlreadyClaimed =
    isNewAccount &&
    (
      await db.execute(
        sql`SELECT 1 FROM trial_entitlements WHERE program_id = 'free_trial_v1' AND identity_fingerprint = ${fingerprint}`,
      )
    ).rows.length > 0;
  const trialGranted = isNewAccount && !identityAlreadyClaimed;

  // Provisioning (and therefore the trial quantity) is centralized in the
  // provisioning service so the dev adapter and the Clerk path cannot drift
  // apart, and so the grant matches what the marketing site advertises.
  const result = await provisionUserAndTrial({
    clerkId,
    email,
    displayName: input.displayName ?? null,
    fingerprint,
  });

  if (identityAlreadyClaimed) {
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
  // Welcome email only when this request actually granted the trial — not on
  // every returning sign-in.
  if (trialGranted) {
    const { sendWelcomeEmail } = await import("@/server/services/email");
    sendWelcomeEmail(email, input.displayName).catch(() => {});
  }

  return { userId: result, trialGranted };
}

export async function signOut() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) {
    await db.delete(authSessions).where(eq(authSessions.tokenHash, sha256Hex(raw)));
  }
  jar.delete(SESSION_COOKIE);

  // Clerk keeps its own session cookies; without revoking that session the
  // user is silently signed straight back in.
  if (getConfig().authMode === "clerk") {
    try {
      const { auth, clerkClient } = await import("@clerk/nextjs/server");
      const { sessionId } = await auth();
      if (sessionId) {
        const client = await clerkClient();
        await client.sessions.revokeSession(sessionId);
      }
    } catch (err) {
      logger.warn("auth.clerk_signout_failed", { error: String(err) });
    }
  }
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

/**
 * Throwing variants for API handlers: the sentinel is the exact error the
 * handlers used to build by hand, so `errorResponse` still answers 401
 * UNAUTHENTICATED — one place decides unauthenticated, not fifty.
 */
export async function requireApiUser(): Promise<SessionUser> {
  const user = await getApiUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

/** Signed in, any account status — privacy/export flows must stay reachable while deleting. */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export { pool };
