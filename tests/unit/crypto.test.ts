import { describe, it, expect } from "vitest";
import { encryptEnvelope, decryptEnvelope, emailFingerprint, identityFingerprint, constantTimeEqual, sha256Hex } from "@/server/crypto";

describe("envelope encryption (AES-256-GCM)", () => {
  it("roundtrips plaintext with AAD binding and rejects wrong AAD", () => {
    const env = encryptEnvelope("priya.sharma@lumen-analytics.example", "contact:abc-123");
    expect(env.startsWith("v1.")).toBe(true);
    expect(decryptEnvelope(env, "contact:abc-123")).toBe("priya.sharma@lumen-analytics.example");
    // A different AAD binding must fail authentication.
    expect(() => decryptEnvelope(env, "contact:other-id")).toThrow();
  });

  it("rejects tampered ciphertext and malformed envelopes", () => {
    const env = encryptEnvelope("secret", "aad");
    const parts = env.split(".");
    const tampered = `v1.${parts[1]}.${Buffer.from("tampered").toString("base64")}.${parts[3]}`;
    expect(() => decryptEnvelope(tampered, "aad")).toThrow();
    expect(() => decryptEnvelope("garbage", "aad")).toThrow(/MALFORMED_ENVELOPE/);
  });
});

describe("fingerprints and comparisons", () => {
  it("produces stable fingerprints without storing plaintext", () => {
    const fp1 = emailFingerprint("User@Example.com ");
    const fp2 = emailFingerprint("user@example.com");
    expect(fp1).toBe(fp2);
    expect(fp1).not.toContain("user@example.com");
    expect(identityFingerprint("a@b.example")).toHaveLength(40);
    expect(constantTimeEqual(sha256Hex("a"), sha256Hex("a"))).toBe(true);
    expect(constantTimeEqual(sha256Hex("a"), sha256Hex("b"))).toBe(false);
  });
});
