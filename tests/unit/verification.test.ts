import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DNS resolver so the tests never touch the network. The behaviour
// under test is what happens when the lookup fails, which is exactly the
// Cloudflare Workers case (no node:dns, no outbound TCP).
vi.mock("node:dns/promises", () => {
  const resolveMx = vi.fn();
  return { default: { resolveMx }, resolveMx };
});

import dns from "node:dns/promises";
import { verifyMailboxPreflight } from "@/server/services/verification";

const resolveMx = dns.resolveMx as unknown as ReturnType<typeof vi.fn>;

describe("mailbox preflight classification", () => {
  beforeEach(() => {
    resolveMx.mockReset();
  });

  it("reports a lookup failure as unavailable, never as invalid", async () => {
    resolveMx.mockRejectedValue(new Error("getaddrinfo ENOTFOUND"));

    const result = await verifyMailboxPreflight("someone@nowhere.invalid");

    // Regression: this used to return "invalid", which made every contact
    // reveal fail in production (Workers have no DNS) and permanently marked
    // the whole directory invalid. A check that could not run is not a
    // negative result.
    expect(result.status).toBe("unavailable");
    expect(result.status).not.toBe("invalid");
  });

  it("reports a domain with no MX records as genuinely invalid", async () => {
    resolveMx.mockResolvedValue([]);

    const result = await verifyMailboxPreflight("someone@no-mx.example");

    expect(result.status).toBe("invalid");
  });

  it("rejects malformed addresses before any lookup", async () => {
    const result = await verifyMailboxPreflight("not-an-email");

    expect(result.status).toBe("invalid");
    expect(resolveMx).not.toHaveBeenCalled();
  });
});