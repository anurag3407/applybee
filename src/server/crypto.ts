import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { getConfig } from "./config";

/**
 * Token/email envelope encryption: AES-256-GCM with random nonce and
 * associated-data binding (§16.3, §17.4). Key versioning supports rotation.
 */

function resolveKey(): { key: Buffer; version: number } {
  const config = getConfig();
  const version = Number(config.TOKEN_ENCRYPTION_KEY_VERSION) || 1;
  if (config.TOKEN_ENCRYPTION_KEY) {
    const key = Buffer.from(config.TOKEN_ENCRYPTION_KEY, "base64");
    if (key.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes base64");
    return { key, version };
  }
  // Development-only derived key. Production requires an explicit key
  // (validated in config) — this path must not exist there.
  if (config.isProduction) throw new Error("TOKEN_ENCRYPTION_KEY is required in production");
  return {
    key: createHash("sha256").update("applybee-local-dev-encryption-key").digest(),
    version,
  };
}

export function encryptEnvelope(plaintext: string, aad: string): string {
  const { key, version } = resolveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad));
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `v${version}.${iv.toString("base64")}.${enc.toString("base64")}.${cipher.getAuthTag().toString("base64")}`;
}

export function decryptEnvelope(envelope: string, aad: string): string {
  const [v, ivB64, dataB64, tagB64] = envelope.split(".");
  if (v !== "v1" || !ivB64 || !dataB64 || !tagB64) throw new Error("MALFORMED_ENVELOPE");
  const { key } = resolveKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** HMAC fingerprint for dedupe/suppression without indexing plaintext. */
export function emailFingerprint(email: string): string {
  const { key } = resolveKey();
  return createHmac("sha256", key)
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

/** Keyed identity fingerprint for trial entitlements — no plaintext identity. */
export function identityFingerprint(verifiedEmail: string): string {
  const { key } = resolveKey();
  return createHmac("sha256", key)
    .update(`trial-v1:${verifiedEmail.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 40);
}

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
