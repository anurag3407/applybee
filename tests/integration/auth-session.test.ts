import { describe, it, expect, beforeAll, vi } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import type { Client } from "pg";
import { getTestDb } from "../setup/db";

/**
 * Auth session flow for the labeled email adapter: provisioning converges on
 * one account per verified email, the trial is granted exactly once per
 * identity, and a returning sign-in never re-claims it.
 */
process.env.AUTH_MODE = "dev";
// Never send real transactional email from tests.
process.env.RESEND_API_KEY = "";

const { cookieJar } = vi.hoisted(() => ({ cookieJar: new Map<string, string>() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
    set: (name: string, value: string) => {
      cookieJar.set(name, value);
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  }),
}));

let client: Client;
beforeAll(async () => {
  client = await getTestDb();
});

function devClerkId(email: string): string {
  return `dev:${createHash("sha256").update(email).digest("hex").slice(0, 24)}`;
}

describe("devSignIn (labeled email adapter)", () => {
  it("grants the trial once and keeps returning sign-ins on the same account", async () => {
    const { devSignIn } = await import("@/server/auth/session");
    const { identityFingerprint } = await import("@/server/crypto");
    const email = `auth-${randomUUID()}@test.example`;

    const first = await devSignIn({ email, displayName: "Auth Tester" });
    expect(first.trialGranted).toBe(true);

    const second = await devSignIn({ email, displayName: "Auth Tester" });
    expect(second.userId).toBe(first.userId);
    // A returning sign-in must not report or trigger the trial again.
    expect(second.trialGranted).toBe(false);

    const users = await client.query(`SELECT id FROM users WHERE clerk_id = $1`, [devClerkId(email)]);
    expect(users.rows).toHaveLength(1);

    const entitlements = await client.query(
      `SELECT id FROM trial_entitlements WHERE identity_fingerprint = $1 AND program_id = 'free_trial_v1'`,
      [identityFingerprint(email)],
    );
    expect(entitlements.rows).toHaveLength(1);

    const sessions = await client.query(`SELECT id FROM auth_sessions WHERE user_id = $1`, [first.userId]);
    expect(sessions.rows).toHaveLength(2);
  });

  it("does not re-grant the trial when the identity already consumed one", async () => {
    const { devSignIn } = await import("@/server/auth/session");
    const { identityFingerprint } = await import("@/server/crypto");
    const email = `reclaim-${randomUUID()}@test.example`;
    const fingerprint = identityFingerprint(email);

    // A previous account with the same verified identity consumed the trial
    // (delete + re-register). The retained entitlement is the §17.2 tombstone.
    await client.query(
      `INSERT INTO trial_entitlements (program_id, identity_fingerprint, decision, policy_version)
       VALUES ('free_trial_v1', $1, 'eligible', 'test')`,
      [fingerprint],
    );

    const result = await devSignIn({ email });
    expect(result.trialGranted).toBe(false);

    const contacts = await client.query<{ available: number }>(
      `SELECT available FROM credit_accounts WHERE user_id = $1 AND type = 'contact'`,
      [result.userId],
    );
    expect(contacts.rows[0]!.available).toBe(0);

    const entitlements = await client.query(
      `SELECT id FROM trial_entitlements WHERE identity_fingerprint = $1 AND program_id = 'free_trial_v1'`,
      [fingerprint],
    );
    expect(entitlements.rows).toHaveLength(1);
  });
});
