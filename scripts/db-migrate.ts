/**
 * Applies committed migrations in order with the migration role
 * (DATABASE_MIGRATION_URL, plan §5.1/§28.4). Never run automatic destructive
 * migrations on app startup.
 */
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
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

  // Audited SQL functions are versioned as their own migration entry.
  if (!applied.has("functions.sql")) {
    const sql = await readFile(FUNCTIONS_FILE, "utf8");
    console.log("Applying functions.sql…");
    await client.query(sql);
    await client.query("INSERT INTO _migrations (name) VALUES ('functions.sql')");
  }

  console.log("Migrations complete.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
