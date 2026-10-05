/**
 * Re-seal contact email envelopes (and their fingerprints) under the ACTIVE
 * TOKEN_ENCRYPTION_KEY. Repair + rotation tool: rows sealed with a retired or
 * fallback key are decrypted with the best available candidate key and
 * re-encrypted in place with the configured one.
 *
 * Candidates tried, in order: the active TOKEN_ENCRYPTION_KEY, then the
 * development-only derived fallback key. A row whose envelope cannot be
 * decrypted by any candidate is reported and left untouched.
 *
 * Run: `pnpm tsx scripts/reencrypt-envelopes.ts [--apply]`
 *      without --apply it only reports what would change.
 */
import "./env";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { Client } from "pg";

function activeKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (raw) {
    const key = Buffer.from(raw, "base64");
    if (key.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes base64");
    return key;
  }
  // Same development-only derived key as src/server/crypto.ts and db-seed.ts.
  return createHash("sha256").update("applybee-local-dev-encryption-key").digest();
}

function fallbackDevKey(): Buffer {
  return createHash("sha256").update("applybee-local-dev-encryption-key").digest();
}

const ENVELOPE_VERSION = Number(process.env.TOKEN_ENCRYPTION_KEY_VERSION) || 1;

function decryptWith(key: Buffer, envelope: string, aad: string): string | null {
  const [rawVersion, ivB64, dataB64, tagB64] = envelope.split(".");
  if (!rawVersion?.startsWith("v") || !ivB64 || !dataB64 || !tagB64) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
    decipher.setAAD(Buffer.from(aad));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  const key = activeKey();
  const legacy = fallbackDevKey();
  const sameKeyMaterial = key.equals(legacy);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const rows = (
    await client.query<{ id: string; email_enc: string | null }>(
      `SELECT id, email_enc FROM contacts WHERE email_enc IS NOT NULL`,
    )
  ).rows;

  let ok = 0, resealed = 0, failed = 0;
  for (const row of rows) {
    const aad = `contact:${row.id}`;
    const envelope = row.email_enc!;
    const plaintext = decryptWith(key, envelope, aad);
    if (plaintext !== null) {
      ok++;
      continue;
    }
    const legacyPlaintext = sameKeyMaterial ? null : decryptWith(legacy, envelope, aad);
    if (legacyPlaintext === null) {
      failed++;
      console.error(`UNRECOVERABLE contact=${row.id} — no candidate key authenticates this envelope`);
      continue;
    }
    // Re-seal under the active key and refresh the fingerprint (the old one was
    // HMAC'd with the legacy key, so dedupe/suppression lookups would miss).
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    cipher.setAAD(Buffer.from(aad));
    const enc = Buffer.concat([cipher.update(legacyPlaintext, "utf8"), cipher.final()]);
    const newEnvelope = `v${ENVELOPE_VERSION}.${iv.toString("base64")}.${enc.toString("base64")}.${cipher.getAuthTag().toString("base64")}`;
    const fingerprint = createHmac("sha256", key).update(legacyPlaintext.trim().toLowerCase()).digest("hex").slice(0, 32);
    if (apply) {
      await client.query(`UPDATE contacts SET email_enc = $1, email_fingerprint = $2 WHERE id = $3`, [
        newEnvelope,
        fingerprint,
        row.id,
      ]);
    }
    resealed++;
    console.log(`${apply ? "RESEALED" : "WOULD RESEAL"} contact=${row.id}`);
  }

  console.log(`contacts: ${rows.length} ok=${ok} ${apply ? "resealed" : "needsReseal"}=${resealed} unrecoverable=${failed}`);
  await client.end();
  if (failed > 0) process.exit(1);
}

main();
