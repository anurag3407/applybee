import { describe, it, expect } from "vitest";
import {
  buildMimeMessage,
  encodeHeaderValue,
  formatAddressHeader,
  sanitizeDisplayName,
  sanitizeFilename,
  validateEmailAddress,
} from "@/server/adapters/mime";

/**
 * MIME golden fixtures (§16.4, §31.1 provider contracts): CRLF, RFC 2047,
 * attachment encoding, injection rejection, base64url raw output.
 */
describe("MIME builder", () => {
  const base = {
    fromEmail: "sender@lumen-analytics.example",
    fromName: "Apply Bee (draft only)",
    toEmail: "priya.sharma@lumen-analytics.example",
    toName: "Priya Sharma",
    subject: "Platform role — background that may fit Lumen",
    body: "Hi Priya,\n\nI'm Aarav.\n",
    operationMarker: "ab-test-marker",
  };

  it("builds a valid RFC 5322 message with CRLF and required headers", () => {
    const out = buildMimeMessage(base);
    expect(out.raw).toContain("From: \"Apply Bee (draft only)\" <sender@lumen-analytics.example>\r\n");
    expect(out.raw).toContain("To: \"Priya Sharma\" <priya.sharma@lumen-analytics.example>\r\n");
    // Non-ASCII em dash → RFC 2047 encoded word that decodes to the subject.
    const subjectLine = out.raw.split("\r\n").find((l) => l.startsWith("Subject: "))!;
    expect(subjectLine).toMatch(/^Subject: =\?UTF-8\?B\?/);
    const decoded = Buffer.from(subjectLine.split("?B?")[1]!.replace("?=", ""), "base64").toString("utf8");
    expect(decoded).toBe("Platform role — background that may fit Lumen");
    expect(out.raw).toContain("MIME-Version: 1.0\r\n");
    expect(out.raw).toContain('Content-Type: text/plain; charset="UTF-8"');
    expect(out.raw).toContain("X-ApplyBee-Operation: ab-test-marker");
    // Body CRLF
    expect(out.raw).toContain("Hi Priya,\r\n\r\nI'm Aarav.\r\n");
    // base64url decodes back to raw
    expect(Buffer.from(out.rawBase64Url, "base64url").toString("utf8")).toBe(out.raw);
    expect(out.byteSize).toBe(Buffer.byteLength(out.raw, "utf8"));
  });

  it("encodes non-ASCII subjects as RFC 2047 B-words", () => {
    const encoded = encodeHeaderValue("Internship inquiry — 役割");
    expect(encoded).toMatch(/^=\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=$/);
    const decoded = Buffer.from(encoded.split("?B?")[1]!.replace("?=", ""), "base64").toString("utf8");
    expect(decoded).toBe("Internship inquiry — 役割");
  });

  it("builds multipart/mixed with a base64 PDF attachment", () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
    const out = buildMimeMessage({ ...base, attachment: { filename: "resume final.pdf", bytes: pdfBytes, contentType: "application/pdf" } });
    expect(out.raw).toContain("multipart/mixed");
    expect(out.raw).toContain('Content-Disposition: attachment; filename="resume final.pdf"');
    expect(out.raw).toContain("Content-Transfer-Encoding: base64");
    // The attachment body must be base64 of the exact bytes.
    const b64 = Buffer.from(pdfBytes).toString("base64");
    expect(out.raw).toContain(b64);
  });

  it("wraps long base64 attachments at 76 chars", () => {
    const big = new Uint8Array(1000).fill(0x41);
    const out = buildMimeMessage({ ...base, attachment: { filename: "a.pdf", bytes: big, contentType: "application/pdf" } });
    const lines = out.raw.split("\r\n");
    const b64Start = lines.findIndex((l) => l === "Content-Transfer-Encoding: base64");
    const attachmentLines = lines.slice(b64Start + 2, b64Start + 20).filter((l) => /^[A-Za-z0-9+/=]+$/.test(l));
    for (const l of attachmentLines) expect(l.length).toBeLessThanOrEqual(76);
  });

  it("rejects CR/LF injection in addresses and neutralizes header injection in subjects", () => {
    expect(validateEmailAddress("evil@x.example\r\nBcc: victim@y.example").ok).toBe(false);
    expect(() => buildMimeMessage({ ...base, toEmail: "evil@x.example\r\nBcc: v@y.example" })).toThrow(/INVALID_TO/);
    // A CRLF inside the subject is stripped, so it stays ONE folded-safe header
    // line — no injected Bcc header can appear.
    const out = buildMimeMessage({ ...base, subject: "Hello\r\nBcc: victim@y.example" });
    expect(out.raw).not.toMatch(/\r\nBcc:/);
  });

  it("sanitizes display names and filenames", () => {
    expect(sanitizeDisplayName('Evil" <script>')).toBe("Evil script");
    expect(sanitizeFilename('../../weird "name".pdf')).toBe(".._.._weird _name_.pdf");
    expect(sanitizeFilename("")).toBe("resume.pdf");
  });

  it("formats address headers complying with RFC 2047 and RFC 5322", () => {
    expect(formatAddressHeader(null, "user@example.com")).toBe("<user@example.com>");
    expect(formatAddressHeader("Alice Smith", "alice@example.com")).toBe('"Alice Smith" <alice@example.com>');
    // Non-ASCII display name must be encoded as RFC 2047 encoded-word, but <email> must remain unencoded
    const formatted = formatAddressHeader("Jürgen Müller", "jurgen@example.com");
    expect(formatted).toMatch(/^=\?UTF-8\?B\?[A-Za-z0-9+/=]+\?= <jurgen@example.com>$/);
    expect(formatted).not.toContain('"=?UTF-8?B?');
  });

  it("builds message with non-ASCII sender without corrupting addr-spec", () => {
    const out = buildMimeMessage({
      ...base,
      fromName: "René Descartes",
      toName: "François Viète",
    });
    expect(out.raw).toContain("<sender@lumen-analytics.example>\r\n");
    expect(out.raw).toContain("<priya.sharma@lumen-analytics.example>\r\n");
    expect(out.raw).not.toContain("<?UTF-8?");
  });

  it("produces a safe opaque marker header (no PII)", () => {
    const out = buildMimeMessage({ ...base, operationMarker: "ab-abc123<TOKEN>" });
    expect(out.raw).toContain("X-ApplyBee-Operation: ab-abc123TOKEN");
  });

  it("has no send capability in the module surface", async () => {
    // Structural negative test (§16.6): the module exports no send function.
    const mod = (await import("@/server/adapters/mime")) as unknown as Record<string, unknown>;
    for (const key of Object.keys(mod)) {
      expect(key.toLowerCase()).not.toContain("send");
    }
  });
});
