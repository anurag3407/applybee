import { describe, it, expect } from "vitest";

/**
 * The labeled dev/email adapter must never be an alternative authentication
 * path once Clerk is configured (or in production). The route self-guards so
 * a stray deployment cannot expose unverified email sign-in.
 */
process.env.AUTH_MODE = "clerk";

describe("dev-signin route guard", () => {
  it("rejects POST when the Clerk adapter is active", async () => {
    const { POST } = await import("@/app/api/v1/auth/dev-signin/route");
    const res = await POST(
      new Request("http://localhost:3000/api/v1/auth/dev-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "attacker@example.com" }),
      }),
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
