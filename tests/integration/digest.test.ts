import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { getTestDb, createTestUser } from "../setup/db";
import {
  seedInitialHiringPostsIfEmpty,
  getDigestPostsForUser,
  renderDailyDigestHtml,
  dispatchDigestForUser,
  type DispatchUserResult,
} from "@/server/services/digest";
import { updatePreferences, getPreferences } from "@/server/services/resumes";
import { getConfig } from "@/server/config";

let client: Client;

beforeAll(async () => {
  client = await getTestDb();
});

/** Why a dispatch did not go out — undefined when it did not skip. */
function skippedReason(result: DispatchUserResult): string | undefined {
  return !result.success && result.skipped ? result.reason : undefined;
}

describe("Daily Hiring Digest (Option B)", () => {
  it("seeds initial curated hiring posts if table is empty", async () => {
    const seeded = await seedInitialHiringPostsIfEmpty();
    expect(seeded).toBeGreaterThanOrEqual(10);

    // Running again should be a no-op
    const reseeded = await seedInitialHiringPostsIfEmpty();
    expect(reseeded).toBe(0);
  });

  it("selects exactly 10 hiring posts for a user and matches role preferences", async () => {
    const userId = await createTestUser(`cand-${randomUUID()}@test.example`, 5, 2);
    await updatePreferences(userId, {
      targetRoles: ["Frontend", "React"],
      targetLocations: ["Bengaluru"],
    });

    const posts = await getDigestPostsForUser(userId, 10);
    expect(posts.length).toBe(10);

    // Top posts should include frontend/React/Bengaluru matches
    const hasMatch = posts.some(
      (p) =>
        p.title.toLowerCase().includes("frontend") ||
        p.title.toLowerCase().includes("react") ||
        p.techStack.some((t) => t.toLowerCase().includes("react")),
    );
    expect(hasMatch).toBe(true);
  });

  it("renders a responsive HTML email with credits balance and 1-click action buttons", async () => {
    const userId = await createTestUser(`html-${randomUUID()}@test.example`, 10, 5);
    const posts = await getDigestPostsForUser(userId, 10);

    const html = renderDailyDigestHtml({
      displayName: "Anurag",
      posts,
      contactCredits: 10,
      aiCredits: 5,
    });

    expect(html).toContain("Good morning, Anurag!");
    expect(html).toContain("10 Contact Reveals");
    expect(html).toContain("5 AI Drafts Available");
    expect(html).toContain("Draft in Gmail");
    expect(html).toContain("Reveal email");

    // Deep links must resolve to real routes and use the configured base URL.
    // They used to point at "/app?action=draft", which the dashboard never
    // read — every call to action in the digest was a dead link.
    const baseUrl = getConfig().APP_BASE_URL.replace(/\/+$/, "");
    expect(html).toContain(baseUrl);
    expect(html).toMatch(/href="[^"]*\/app\/contacts/);
    expect(html).not.toContain("/app?action=");
    expect(html).toContain(`${baseUrl}/app/settings`);
  });

  it("escapes directory-supplied text in the HTML body", () => {
    const html = renderDailyDigestHtml({
      displayName: "<script>alert(1)</script>",
      posts: [
        {
          id: "p1",
          title: 'Senior <img src=x onerror="alert(1)">',
          companyName: "Acme & Co",
          location: "<b>Bangalore</b>",
          roleCategory: "engineering",
          department: "engineering",
          sourcePlatform: "reachbee",
          sourceUrl: null,
          postSnippet: "Hiring <script>alert('xss')</script> now",
          techStack: ["<i>React</i>"],
          hiringManagerName: "Ada <script>",
          hiringManagerTitle: "CTO",
          postedAt: new Date(),
        },
      ],
      contactCredits: 1,
      aiCredits: 1,
    });

    // No live markup survives: the injected tags appear only in escaped form.
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img");
    expect(html).toContain("Acme &amp; Co");
  });

  it("dispatches digest, prevents duplicate dispatch today, and allows force dispatch", async () => {
    const userId = await createTestUser(`dispatch-${randomUUID()}@test.example`, 5, 2);

    // First dispatch succeeds with all 10 posts and an email id.
    expect(await dispatchDigestForUser(userId)).toMatchObject({
      success: true,
      postCount: 10,
      emailId: expect.any(String),
    });

    // Immediate second dispatch on same day is skipped (idempotent).
    expect(skippedReason(await dispatchDigestForUser(userId))).toBe("ALREADY_SENT_TODAY");

    // Force dispatch bypasses idempotency
    const forceResult = await dispatchDigestForUser(userId, { force: true });
    expect(forceResult.success).toBe(true);
  });

  it("respects user preference opting out of daily digest", async () => {
    const userId = await createTestUser(`optout-${randomUUID()}@test.example`, 5, 2);

    // Disable daily digest in preferences
    await updatePreferences(userId, { dailyDigestEnabled: false });

    const { prefs } = await getPreferences(userId);
    expect(prefs?.dailyDigestEnabled).toBe(false);

    // Dispatch should be skipped by preference.
    expect(skippedReason(await dispatchDigestForUser(userId))).toBe("DIGEST_PREFERENCE_DISABLED");
  });
});
