import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { getTestDb, createTestUser } from "../setup/db";
import {
  seedInitialHiringPostsIfEmpty,
  getDigestPostsForUser,
  renderDailyDigestHtml,
  dispatchDigestForUser,
} from "@/server/services/digest";
import { updatePreferences, getPreferences } from "@/server/services/resumes";

let client: Client;

beforeAll(async () => {
  client = await getTestDb();
});

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
    expect(html).toContain("⚡ 1-Click Draft to Gmail");
    expect(html).toContain("🔓 Reveal Direct Email");
    expect(html).toContain("https://applybee.sayalabs.in/app?action=draft");
    expect(html).toContain("https://applybee.sayalabs.in/app/settings");
  });

  it("dispatches digest, prevents duplicate dispatch today, and allows force dispatch", async () => {
    const userId = await createTestUser(`dispatch-${randomUUID()}@test.example`, 5, 2);

    // First dispatch succeeds
    const firstResult = await dispatchDigestForUser(userId);
    expect(firstResult.success).toBe(true);
    if (firstResult.success) {
      expect(firstResult.postCount).toBe(10);
      expect(firstResult.emailId).toBeDefined();
    }

    // Immediate second dispatch on same day is skipped (idempotent)
    const secondResult = await dispatchDigestForUser(userId);
    expect(!secondResult.success && secondResult.skipped).toBe(true);
    if (!secondResult.success && secondResult.skipped) {
      expect(secondResult.reason).toBe("ALREADY_SENT_TODAY");
    }

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

    // Dispatch should be skipped
    const res = await dispatchDigestForUser(userId);
    expect(!res.success && res.skipped).toBe(true);
    if (!res.success && res.skipped) {
      expect(res.reason).toBe("DIGEST_PREFERENCE_DISABLED");
    }
  });
});
