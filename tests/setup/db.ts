import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";
import { createHash, randomBytes } from "node:crypto";

/**
 * Applies committed migrations to the test database once per run. Uses the
 * same migration files as production — no schema drift between test and prod.
 */

const globalForTest = globalThis as unknown as { __applyBeeTestReady?: Promise<Client> };

export const TEST_DB_URL = process.env.TEST_DATABASE_URL ?? "postgresql://localhost:5432/applybee_test";

// Deterministic dev encryption key so email envelopes decrypt in tests.
process.env.TOKEN_ENCRYPTION_KEY ??= createHash("sha256")
  .update(randomBytes(0).length.toString())
  .digest("base64");

export function getTestDb(): Promise<Client> {
  if (!globalForTest.__applyBeeTestReady) {
    globalForTest.__applyBeeTestReady = setup();
  }
  return globalForTest.__applyBeeTestReady;
}

async function setup(): Promise<Client> {
  // This setup drops the public schema. Refuse to do that against anything
  // that isn't obviously a throwaway test database — a stray TEST_DATABASE_URL
  // pointing at a real instance would destroy production data.
  const databaseName = (() => {
    try {
      return new URL(TEST_DB_URL).pathname.replace(/^\//, "");
    } catch {
      return "";
    }
  })();
  if (databaseName && !/test/i.test(databaseName)) {
    throw new Error(
      `Refusing to reset schema: TEST_DATABASE_URL points at database "${databaseName}", which does not look like a test database.`,
    );
  }

  const client = new Client({ connectionString: TEST_DB_URL });
  await client.connect();

  // Deterministic clean slate per test run (test DB only).
  await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
  await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");

  const migrationsDir = path.resolve(process.cwd(), "src/db/migrations");
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    await client.query(sql);
  }
  const functions = await readFile(path.resolve(process.cwd(), "src/db/functions.sql"), "utf8");
  await client.query(functions);

  // Minimal deterministic catalog for billing tests.
  const catalog = await client.query<{ id: string }>(
    `INSERT INTO catalog_versions (version, state, published_at) VALUES ('test', 'published', now()) RETURNING id`,
  );
  await client.query(
    `INSERT INTO catalog_skus (catalog_version_id, sku, name, price_paise, currency, contact_credits, ai_credits)
     VALUES ($1, 'plus_v1', 'Plus', 29900, 'INR', 150, 30)`,
    [catalog.rows[0]!.id],
  );

  return client;
}

export async function createTestUser(email: string, contactCredits = 5, aiCredits = 2): Promise<string> {
  const client = await getTestDb();
  const fingerprint = createHash("sha256").update(`trial-test:${email}`).digest("hex").slice(0, 40);
  const clerkId = `test:${createHash("sha256").update(email).digest("hex").slice(0, 24)}`;
  const res = await client.query<{ user_id: string }>(
    `SELECT provision_user_and_trial($1, $2, $3, $4, $5, $6, 'test') AS user_id`,
    [clerkId, email, "Test User", fingerprint, contactCredits, aiCredits],
  );
  return res.rows[0]!.user_id;
}

export async function seedTestContact(companyName = "Test Co", domain = "test.example"): Promise<string> {
  const client = await getTestDb();
  const company = await client.query<{ id: string }>(
    `INSERT INTO companies (name, domain) VALUES ($1, $2) ON CONFLICT (domain) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [companyName, domain],
  );
  const contact = await client.query<{ id: string }>(
    `INSERT INTO contacts (company_id, name, title, role_category, email_fingerprint, email_domain, verification_status)
     VALUES ($1, 'Test Person', 'Engineering Manager', 'engineering_manager', $2, $3, 'verified') RETURNING id`,
    [company.rows[0]!.id, `fp-${crypto.randomUUID()}`, domain],
  );
  return contact.rows[0]!.id;
}
