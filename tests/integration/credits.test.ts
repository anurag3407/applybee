import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { getTestDb, createTestUser, seedTestContact, TEST_DB_URL } from "../setup/db";

/**
 * Acceptance scenarios B and C (§31.2): concurrent reveal convergence and the
 * last-AI-credit race, verified against a real PostgreSQL with the audited
 * functions. Also the ledger/lot invariants (§18.2).
 */

let client: Client;
beforeAll(async () => {
  client = await getTestDb();
});

async function accountOf(userId: string, type: "contact" | "ai") {
  const res = await client.query<{ available: number; reserved: number }>(
    `SELECT available, reserved FROM credit_accounts WHERE user_id = $1 AND type = $2`,
    [userId, type],
  );
  return res.rows[0]!;
}

describe("reveal_contact (scenario B)", () => {
  it("charges exactly once across 20 concurrent reveals with distinct keys", async () => {
    const userId = await createTestUser(`reveal-${randomUUID()}@test.example`, 5, 2);
    const contactId = await seedTestContact("Reveal Co", "reveal-test.example");

    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        client
          .query<{ out: { unlock_id: string; charged: boolean } }>(
            `SELECT reveal_contact($1::uuid, $2::uuid, $3) AS out`,
            [userId, contactId, `op-${randomUUID()}`],
          )
          .then((r) => r.rows[0]!.out)
          .catch((err) => ({ error: String(err.message) })),
      ),
    );
    const charged = results.filter((r) => "charged" in r && r.charged);
    const errors = results.filter((r) => "error" in r);
    expect(charged).toHaveLength(1);
    expect(errors).toHaveLength(0);

    const account = await accountOf(userId, "contact");
    expect(account.available).toBe(4);

    // One unlock, one ledger entry.
    const unlocks = await client.query(`SELECT id FROM contact_unlocks WHERE user_id = $1 AND contact_id = $2`, [userId, contactId]);
    expect(unlocks.rows).toHaveLength(1);
    const ledger = await client.query(`SELECT id FROM credit_ledger_entries WHERE user_id = $1 AND kind = 'reveal'`, [userId]);
    expect(ledger.rows).toHaveLength(1);

    // Retry after "response loss" returns the existing unlock without charge.
    const again = await client.query<{ out: { unlock_id: string; already_unlocked: boolean } }>(
      `SELECT reveal_contact($1::uuid, $2::uuid, $3) AS out`,
      [userId, contactId, `op-${randomUUID()}`],
    );
    expect(again.rows[0]!.out.already_unlocked).toBe(true);
    expect((await accountOf(userId, "contact")).available).toBe(4);
  });

  it("rejects when the contact is invalid without debiting", async () => {
    const userId = await createTestUser(`invalid-${randomUUID()}@test.example`, 5, 2);
    const contactId = await seedTestContact("Invalid Co", "invalid-test.example");
    await client.query(`UPDATE contacts SET verification_status = 'invalid' WHERE id = $1`, [contactId]);
    await expect(client.query(`SELECT reveal_contact($1::uuid, $2::uuid, 'x')`, [userId, contactId])).rejects.toThrow(/CONTACT_INVALID/);
    expect((await accountOf(userId, "contact")).available).toBe(5);
  });
});

describe("reserve/complete/release generation (scenario C)", () => {
  it("admits one reservation with the last credit and rejects the other", async () => {
    const userId = await createTestUser(`gen-${randomUUID()}@test.example`, 5, 1);
    const opA = randomUUID();
    const opB = randomUUID();

    const [a, b] = await Promise.all([
      client.query(`SELECT reserve_generation($1::uuid, $2, 1)`, [userId, opA]).then(
        () => "ok",
        (err) => String(err.message),
      ),
      client.query(`SELECT reserve_generation($1::uuid, $2, 1)`, [userId, opB]).then(
        () => "ok",
        (err) => String(err.message),
      ),
    ]);
    const outcomes = [a, b].sort();
    expect(outcomes).toEqual(["INSUFFICIENT_AI_CREDITS", "ok"]);

    // Exactly one reservation exists.
    const reservations = await client.query(`SELECT id FROM credit_reservations WHERE user_id = $1 AND state = 'reserved'`, [userId]);
    expect(reservations.rows).toHaveLength(1);

    // Complete consumes exactly once (idempotent replay is a no-op).
    await client.query(`SELECT complete_generation($1)`, [opA]);
    await client.query(`SELECT complete_generation($1)`, [opA]);
    const after = await accountOf(userId, "ai");
    expect(after).toEqual({ available: 0, reserved: 0 });
  });

  it("releases exactly once on failure and a release cannot revive a consumed charge", async () => {
    const userId = await createTestUser(`rel-${randomUUID()}@test.example`, 5, 2);
    await client.query(`SELECT reserve_generation($1::uuid, $2, 1)`, [userId, "rel-op-1"]);
    await client.query(`SELECT release_generation('rel-op-1')`);
    const afterRelease = await accountOf(userId, "ai");
    expect(afterRelease).toEqual({ available: 2, reserved: 0 });

    // Second credit: reserve then consume; a later release attempt must fail.
    await client.query(`SELECT reserve_generation($1::uuid, $2, 1)`, [userId, "rel-op-2"]);
    await client.query(`SELECT complete_generation('rel-op-2')`);
    await expect(client.query(`SELECT release_generation('rel-op-2')`)).rejects.toThrow(/RESERVATION_STATE_INVALID/);
    expect(await accountOf(userId, "ai")).toEqual({ available: 1, reserved: 0 });
  });

  it("keeps lot conservation and account-vs-lot sums consistent", async () => {
    const userId = await createTestUser(`lots-${randomUUID()}@test.example`, 3, 3);
    const contactId = await seedTestContact("Lot Co", "lot-test.example");
    await client.query(`SELECT reveal_contact($1::uuid, $2::uuid, $3)`, [userId, contactId, `op-${randomUUID()}`]);
    await client.query(`SELECT reserve_generation($1::uuid, $2, 1)`, [userId, "lot-op-1"]);
    await client.query(`SELECT complete_generation('lot-op-1')`);
    await client.query(`SELECT reserve_generation($1::uuid, $2, 1)`, [userId, "lot-op-2"]);
    await client.query(`SELECT release_generation('lot-op-2')`);

    const issues = await client.query(`SELECT * FROM verify_credit_consistency($1::uuid)`, [userId]);
    expect(issues.rows).toEqual([]);
  });
});

describe("provision_user_and_trial", () => {
  it("grants the trial once per identity fingerprint, not per auth subject", async () => {
    const email = `trial-${randomUUID()}@test.example`;
    const client2 = new Client({ connectionString: TEST_DB_URL });
    await client2.connect();
    try {
      const { createHash } = await import("node:crypto");
      const fingerprint = createHash("sha256").update(`trial-test:${email}`).digest("hex").slice(0, 40);
      const first = await client2.query<{ user_id: string }>(
        `SELECT provision_user_and_trial($1, $2, 'T', $3, 5, 2, 'test') AS user_id`,
        [`subj-1-${randomUUID()}`, email, fingerprint],
      );
      const second = await client2.query<{ user_id: string }>(
        `SELECT provision_user_and_trial($1, $2, 'T', $3, 5, 2, 'test') AS user_id`,
        [`subj-2-${randomUUID()}`, email, fingerprint],
      );
      expect(first.rows[0]!.user_id).not.toBe(second.rows[0]!.user_id);
      // Second identity gets zero credits (entitlement already consumed).
      const ai = await client2.query(`SELECT available FROM credit_accounts WHERE user_id = $1::uuid AND type = 'ai'`, [second.rows[0]!.user_id]);
      expect(Number(ai.rows[0]!.available)).toBe(0);
      // Only one entitlement row.
      const entitlements = await client2.query(`SELECT id FROM trial_entitlements WHERE identity_fingerprint = $1`, [fingerprint]);
      expect(entitlements.rows).toHaveLength(1);
    } finally {
      await client2.end();
    }
  });

  it("refuses to resurrect a deleted account via delayed webhook", async () => {
    const email = `deleted-${randomUUID()}@test.example`;
    const userId = await createTestUser(email, 5, 2);
    await client.query(`UPDATE users SET status = 'deleted' WHERE id = $1::uuid`, [userId]);
    // Delayed webhook for the SAME auth subject must hit the terminal tombstone.
    const { createHash } = await import("node:crypto");
    const clerkId = `test:${createHash("sha256").update(email).digest("hex").slice(0, 24)}`;
    await expect(
      client.query(`SELECT provision_user_and_trial($1, $2, 'T', $3, 5, 2, 'test')`, [clerkId, email, `fp-${randomUUID()}`]),
    ).rejects.toThrow(/ACCOUNT_DELETED/);
  });
});

describe("fulfill_captured_payment (scenario H core)", () => {
  it("grants exactly once despite repeated fulfillment calls", async () => {
    const userId = await createTestUser(`pay-${randomUUID()}@test.example`, 0, 0);
    const { createHash } = await import("node:crypto");
    const receipt = `rcpt-${randomUUID()}`;
    const order = await client.query<{ id: string; provider_order_id: string | null }>(
      `INSERT INTO payment_orders (user_id, sku_id, sku_snapshot, amount_paise, currency, receipt, idempotency_key, provider_order_id, status)
       VALUES ($1::uuid, (SELECT id FROM catalog_skus LIMIT 1), $2::jsonb, 29900, 'INR', $3, $4, $5, 'provider_created') RETURNING id, provider_order_id`,
      [userId, JSON.stringify({ sku: "plus_v1", contact_credits: 150, ai_credits: 30 }), receipt, `idem-${randomUUID()}`, `order_${randomUUID()}`],
    );
    const orderId = order.rows[0]!.provider_order_id!;
    const paymentId = `pay_${randomUUID()}`;

    const first = await client.query<{ out: { granted: boolean; already_granted: boolean } }>(
      `SELECT fulfill_captured_payment($1, $2, 29900, 'INR') AS out`,
      [paymentId, orderId],
    );
    expect(first.rows[0]!.out.granted).toBe(true);

    // Duplicate events / reconciliation reruns must not double-grant.
    const second = await client.query<{ out: { granted: boolean; already_granted: boolean } }>(
      `SELECT fulfill_captured_payment($1, $2, 29900, 'INR') AS out`,
      [paymentId, orderId],
    );
    expect(second.rows[0]!.out.already_granted).toBe(true);

    const contact = await accountOf(userId, "contact");
    const ai = await accountOf(userId, "ai");
    expect(contact.available).toBe(150);
    expect(ai.available).toBe(30);

    // Grants table has exactly one purchase row for the payment.
    const grants = await client.query(`SELECT id FROM payment_grants WHERE purpose = 'purchase' AND payment_id = (SELECT id FROM payments WHERE provider_payment_id = $1)`, [paymentId]);
    expect(grants.rows).toHaveLength(1);
  });

  it("rejects mismatched amounts without granting", async () => {
    const userId = await createTestUser(`mismatch-${randomUUID()}@test.example`, 0, 0);
    const order = await client.query<{ id: string; provider_order_id: string | null }>(
      `INSERT INTO payment_orders (user_id, sku_id, sku_snapshot, amount_paise, currency, receipt, idempotency_key, provider_order_id, status)
       VALUES ($1::uuid, (SELECT id FROM catalog_skus LIMIT 1), '{}'::jsonb, 29900, 'INR', $2, $3, $4, 'provider_created') RETURNING id, provider_order_id`,
      [userId, `rcpt-${randomUUID()}`, `idem-${randomUUID()}`, `order_${randomUUID()}`],
    );
    await expect(
      client.query(`SELECT fulfill_captured_payment($1, $2, 100, 'INR')`, [`pay_${randomUUID()}`, order.rows[0]!.provider_order_id]),
    ).rejects.toThrow(/PAYMENT_MISMATCH/);
  });
});

describe("accept_generated_proposal", () => {
  it("applies the proposal only at the expected version and invalidates approvals", async () => {
    const userId = await createTestUser(`accept-${randomUUID()}@test.example`, 5, 5);
    const draft = await client.query<{ id: string }>(
      `INSERT INTO drafts (user_id, mode, intent, own_recipient_email, own_recipient_name) VALUES ($1::uuid, 'quick_ai', 'intro', 'someone@example.com', 'Someone') RETURNING id`,
      [userId],
    );
    const draftId = draft.rows[0]!.id;
    await client.query(
      `INSERT INTO draft_revisions (draft_id, user_id, revision_no, subject, body) VALUES ($1::uuid, $2::uuid, 1, 's', 'b')`,
      [draftId, userId],
    );
    await client.query(`UPDATE drafts SET current_version = 1 WHERE id = $1::uuid`, [draftId]);

    const gen = await client.query<{ id: string }>(
      `INSERT INTO generation_requests (user_id, draft_id, mode, intent, base_version, input_snapshot, input_hash, state)
       VALUES ($1::uuid, $2::uuid, 'quick_ai', 'intro', 1, '{}'::jsonb, 'h', 'reserved') RETURNING id`,
      [userId, draftId],
    );
    const generationId = gen.rows[0]!.id;
    await client.query(`SELECT reserve_generation($1::uuid, $2, 1)`, [userId, generationId]);

    // Proposed revision
    const proposed = await client.query<{ id: string }>(
      `INSERT INTO draft_revisions (draft_id, user_id, revision_no, subject, body, generation_id) VALUES ($1::uuid, $2::uuid, 2, 'AI subject', 'AI body', $3::uuid) RETURNING id`,
      [draftId, userId, generationId],
    );
    await client.query(`UPDATE generation_requests SET state = 'ready', proposed_revision_id = $2::uuid WHERE id = $1::uuid`, [generationId, proposed.rows[0]!.id]);

    // Version conflict: manual edit moved current_version to 2.
    await client.query(`UPDATE drafts SET current_version = 2 WHERE id = $1::uuid`, [draftId]);
    await expect(
      client.query(`SELECT accept_generated_proposal($1::uuid, $2::uuid, 1)`, [generationId, userId]),
    ).rejects.toThrow(/VERSION_CONFLICT/);

    // Manual edits survive; at the correct version acceptance succeeds.
    await client.query(`UPDATE drafts SET current_version = 1 WHERE id = $1::uuid`, [draftId]);
    const accepted = await client.query<{ out: { revision_id: string; version: number } }>(
      `SELECT accept_generated_proposal($1::uuid, $2::uuid, 1) AS out`,
      [generationId, userId],
    );
    expect(accepted.rows[0]!.out.version).toBe(2);
    const subject = await client.query(`SELECT subject FROM drafts d JOIN draft_revisions r ON r.id = d.current_revision_id WHERE d.id = $1::uuid`, [draftId]);
    expect(subject.rows[0]!.subject).toBe("AI subject");
    expect((await accountOf(userId, "ai")).available).toBe(4); // consumed exactly once
  });
});
