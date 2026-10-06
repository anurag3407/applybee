import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { getTestDb, createTestUser, seedTestContact } from "../setup/db";
import { searchDirectory, getContactForUser, revealContactForUser } from "@/server/services/contacts";
import { getMarketingCatalog } from "@/server/services/catalog";
import { getObjectStore } from "@/server/adapters/objectStore";
import { createOpportunity, updateOpportunity, listOpportunities } from "@/server/services/opportunities";
import { createDraft, autosaveDraft, getDraftForUser, exportEml } from "@/server/services/drafts";

let client: Client;

beforeAll(async () => {
  client = await getTestDb();
});

describe("Core Functionality Suite", () => {
  describe("1. Directory & Contact Reveal", () => {
    it("can search directory and reveal email debiting exactly 1 contact credit", async () => {
      const userId = await createTestUser(`dir-${randomUUID()}@test.example`, 5, 2);
      const contactId = await seedTestContact("Acme Corp", "acme-test.example");

      // Search contacts in directory
      const search = await searchDirectory(userId, { q: "Test Person", pageSize: 10 });
      expect(search.rows.length).toBeGreaterThanOrEqual(1);

      // Contact details before reveal
      const before = await getContactForUser(userId, contactId);
      expect(before).not.toBeNull();
      expect(before?.unlocked).toBe(false);
      expect(before?.email).toBeNull(); // Masked

      // Reveal contact
      const reveal = await revealContactForUser({
        userId,
        contactId,
        idempotencyKey: `reveal-idem-${randomUUID()}`,
      });
      expect(reveal.charged).toBe(true);
      expect(reveal.email).toBeDefined();

      // After reveal
      const after = await getContactForUser(userId, contactId);
      expect(after?.unlocked).toBe(true);
      expect(after?.email).toBeDefined();

      // Check balance decremented from 5 to 4
      const acc = await client.query<{ available: number }>(
        `SELECT available FROM credit_accounts WHERE user_id = $1 AND type = 'contact'`,
        [userId],
      );
      expect(acc.rows[0]?.available).toBe(4);
    });
  });

  describe("2. Object Store (Resume Storage)", () => {
    it("can put, get, and delete bytes", async () => {
      const store = getObjectStore("quarantine");
      const testKey = `test-resume-${randomUUID()}.pdf`;
      const testBytes = new TextEncoder().encode("%PDF-1.4 test document %%EOF");

      const meta = await store.put(testKey, testBytes, "application/pdf");
      expect(meta.byteSize).toBe(testBytes.length);

      const retrieved = await store.get(testKey);
      expect(retrieved.length).toBe(testBytes.length);

      await store.delete(testKey);
    });
  });

  describe("3. Billing & Catalog", () => {
    it("retrieves published catalog and verify skus", async () => {
      const catalog = await getMarketingCatalog();
      expect(catalog).not.toBeNull();
      expect(catalog?.skus.length).toBeGreaterThan(0);
      const sku = catalog?.skus.find((s) => s.sku === "plus_v1");
      expect(sku).toBeDefined();
      expect(sku?.pricePaise).toBe(29900);
    });
  });

  describe("4. Pipeline & Opportunities", () => {
    it("creates and updates opportunity stages", async () => {
      const userId = await createTestUser(`pipe-${randomUUID()}@test.example`, 5, 2);
      const contactId = await seedTestContact("Beta Corp", "beta-test.example");

      const oppId = await createOpportunity(userId, {
        companyName: "Beta Corp",
        roleTitle: "Staff Software Engineer",
        contactId,
        stage: "interested",
      });
      expect(oppId).toBeDefined();

      // Advance stage to interview
      await updateOpportunity(userId, oppId, {
        stage: "interview",
      });

      // List opportunities
      const list = await listOpportunities(userId);
      expect(list.length).toBeGreaterThanOrEqual(1);
      const found = list.find((o) => o.id === oppId);
      expect(found).toBeDefined();
      expect(found?.stage).toBe("interview");
    });
  });

  describe("5. Draft Creation, Autosave & .eml Export", () => {
    it("creates a draft, updates it via autosave, and exports as .eml", async () => {
      const userId = await createTestUser(`draft-${randomUUID()}@test.example`, 5, 2);

      const draftId = await createDraft({
        userId,
        mode: "manual",
        intent: "intro",
        recipient: { kind: "own", email: "target@company.example", name: "Target Lead" },
        subject: "Draft Subject",
        body: "Hello from ApplyBee",
      });
      expect(draftId).toBeDefined();

      // Autosave update
      const updated = await autosaveDraft({
        userId,
        draftId,
        expectedVersion: 1,
        subject: "Updated Subject",
        body: "Updated Body content for outreach",
      });
      expect(updated.version).toBe(1);

      // Verify draft state
      const draft = await getDraftForUser(userId, draftId);
      expect(draft).not.toBeNull();
      expect(draft?.currentRevision?.subject).toBe("Updated Subject");

      // Export as .eml
      const eml = await exportEml(userId, draftId);
      expect(eml).not.toBeNull();
      expect(eml?.filename).toMatch(/^(?:reachbee|applybee)-draft-.*\.eml$/);
      expect(eml?.content).toContain("Subject: Updated Subject");
      expect(eml?.content).toContain("Updated Body content");
    });
  });
});
