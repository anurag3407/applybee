import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

/**
 * The dev adapter's proxy gate. The Clerk-mode proxy is exercised by the
 * middleware itself in a real request; these tests pin the properties that
 * caused redirect loops: an unvalidated cookie must never bounce the user
 * between /app and /sign-in, and guests keep their requested path.
 */
process.env.AUTH_MODE = "dev";

type Proxy = (req: NextRequest) => Response;

async function loadProxy(): Promise<{ proxy: Proxy; matcher: string[] }> {
  const mod = (await import("@/proxy")) as unknown as {
    default: Proxy;
    config: { matcher: string[] };
  };
  return { proxy: mod.default, matcher: mod.config.matcher };
}

function locationOf(res: Response): URL | null {
  const location = res.headers.get("location");
  return location ? new URL(location) : null;
}

describe("auth proxy (dev adapter)", () => {
  it("sends guests to sign-in with the requested path preserved", async () => {
    const { proxy } = await loadProxy();
    const res = proxy(new NextRequest("http://localhost:3000/app/drafts/abc?tab=body"));
    expect(res.status).toBe(307);
    const location = locationOf(res);
    expect(location?.pathname).toBe("/sign-in");
    expect(location?.searchParams.get("redirect")).toBe("/app/drafts/abc?tab=body");
  });

  it("gates onboarding and admin like the workspace", async () => {
    const { proxy } = await loadProxy();
    for (const path of ["/onboarding", "/admin/contacts"]) {
      const res = proxy(new NextRequest(`http://localhost:3000${path}`));
      expect(res.status).toBe(307);
      expect(locationOf(res)?.pathname).toBe("/sign-in");
    }
  });

  it("never redirects /sign-in on cookie presence alone (stale session loop)", async () => {
    const { proxy } = await loadProxy();
    const req = new NextRequest("http://localhost:3000/sign-in", {
      headers: { cookie: "ab_session=revoked-or-stale" },
    });
    expect(locationOf(proxy(req))).toBeNull();
  });

  it("lets a cookie-carrying request through and defers validation to the server", async () => {
    const { proxy } = await loadProxy();
    const req = new NextRequest("http://localhost:3000/app", {
      headers: { cookie: "ab_session=present" },
    });
    const res = proxy(req);
    expect(res.status).toBe(200);
    expect(locationOf(res)).toBeNull();
  });

  it("leaves API routes to their own authorization", async () => {
    const { proxy } = await loadProxy();
    expect(locationOf(proxy(new NextRequest("http://localhost:3000/api/v1/me")))).toBeNull();
  });

  it("runs middleware on pages and API routes so Clerk decorates every request", async () => {
    const { matcher } = await loadProxy();
    expect(matcher.some((pattern) => pattern.includes("(api|trpc)"))).toBe(true);
  });
});
