/**
 * Applies committed migrations in order with the migration role
 * (DATABASE_MIGRATION_URL, plan §5.1/§28.4). Never run automatic destructive
 * migrations on app startup.
 */
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { Client } from "pg";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "src/db/migrations");
const FUNCTIONS_FILE = path.resolve(process.cwd(), "src/db/functions.sql");

async function main() {
  const url = process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL (or DATABASE_MIGRATION_URL) is required");
  const client = new Client({ connectionString: url });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  // Audited SQL functions are applied by content hash, not by name alone.
  // Applying them only once meant every later fix to src/db/functions.sql was
  // silently skipped on any database that had already been migrated.
  await client.query(`
    CREATE TABLE IF NOT EXISTS _applied_functions (
      name text PRIMARY KEY,
      sha256 text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  const applied = new Set(
    (await client.query<{ name: string }>("SELECT name FROM _migrations")).rows.map((r) => r.name),
  );

  // pg_trgm backs contact-name search (§17.8). Production clusters pre-create
  // extensions via reviewed DDL; here we ensure availability idempotently.
  await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
  await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    // Drizzle wraps statements in a single transaction per file.
    console.log(`Applying ${file}…`);
    await client.query(sql);
    await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
  }

  // Audited SQL functions: re-apply whenever their content changes. The
  // statements are all CREATE OR REPLACE, so re-applying is idempotent.
  const functionsSql = await readFile(FUNCTIONS_FILE, "utf8");
  const functionsHash = createHash("sha256").update(functionsSql).digest("hex");
  const appliedHash = (
    await client.query<{ sha256: string }>("SELECT sha256 FROM _applied_functions WHERE name = 'functions.sql'")
  ).rows[0]?.sha256;

  if (appliedHash !== functionsHash) {
    console.log(
      appliedHash
        ? "functions.sql changed since last apply — re-applying…"
        : "Applying functions.sql…",
    );
    await client.query(functionsSql);
    await client.query(
      `INSERT INTO _applied_functions (name, sha256) VALUES ('functions.sql', $1)
       ON CONFLICT (name) DO UPDATE SET sha256 = EXCLUDED.sha256, applied_at = now()`,
      [functionsHash],
    );
  } else {
    console.log("functions.sql unchanged — skipping.");
  }

  console.log("Migrations complete.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
