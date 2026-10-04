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

function decodeKey(raw: string): Buffer {
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes base64");
  return key;
}

/**
 * Resolve the key for a given envelope version. The current version uses
 * TOKEN_ENCRYPTION_KEY; retired versions use TOKEN_ENCRYPTION_KEY_V<n>, so a
 * rotation decrypts old envelopes instead of destroying them.
 */
function resolveKeyForVersion(requested?: number): { key: Buffer; version: number } {
  const config = getConfig();
  const version = Number(config.TOKEN_ENCRYPTION_KEY_VERSION) || 1;
  const target = requested ?? version;

  if (config.TOKEN_ENCRYPTION_KEY) {
    if (target === version) return { key: decodeKey(config.TOKEN_ENCRYPTION_KEY), version };
    const retired =
      target === 1 ? config.TOKEN_ENCRYPTION_KEY_V1 : target === 2 ? config.TOKEN_ENCRYPTION_KEY_V2 : undefined;
    if (retired) return { key: decodeKey(retired), version: target };
    throw new Error(`KEY_VERSION_UNSUPPORTED: no key configured for envelope version v${target}`);
  }

  if (config.isProduction) {
    // Never fall back to a publicly known key in production: every contact
    // email and OAuth token would be decryptable by anyone with the source.
    throw new Error("TOKEN_ENCRYPTION_KEY is required in production.");
  }

  // Development-only derived key, clearly labeled and never used in production.
  return {
    key: createHash("sha256").update("applybee-local-dev-encryption-key").digest(),
    version,
  };
}

function resolveKey(): { key: Buffer; version: number } {
  return resolveKeyForVersion();
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
  const [rawVersion, ivB64, dataB64, tagB64] = envelope.split(".");
  if (!rawVersion?.startsWith("v") || !ivB64 || !dataB64 || !tagB64) throw new Error("MALFORMED_ENVELOPE");
  const version = Number(rawVersion.slice(1));
  if (!Number.isInteger(version) || version < 1) throw new Error("MALFORMED_ENVELOPE");
  const { key } = resolveKeyForVersion(version);
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

/** PKCE S256 challenge: base64url(SHA-256(verifier)), per RFC 7636 §4.2. */
export function base64UrlSha256(input: string): string {
  return createHash("sha256").update(input).digest("base64url");
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
