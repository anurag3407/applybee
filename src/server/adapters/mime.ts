/**
 * RFC 5322 / MIME builder for Gmail draft creation (§16.4).
 *
 * Golden fixture tests cover: header folding, CRLF boundaries, RFC 2047
 * UTF-8 subject encoding, base64url raw message, attachment encoding, and
 * CR/LF injection rejection. There is deliberately NO send method anywhere
 * in this module (§16.6).
 */

const MAX_LINE = 76;

export function validateEmailAddress(address: string): { ok: true; local: string; domain: string } | { ok: false; reason: string } {
  if (/[\r\n\x00-\x1f\x7f]/.test(address)) return { ok: false, reason: "control characters" };
  const at = address.lastIndexOf("@");
  if (at <= 0 || at === address.length - 1) return { ok: false, reason: "missing local part or domain" };
  const local = address.slice(0, at);
  const domain = address.slice(at + 1);
  if (local.length > 64) return { ok: false, reason: "local part too long" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return { ok: false, reason: "invalid syntax" };
  return { ok: true, local, domain };
}

/** Sanitize a display name: strip RFC 5322 specials and control characters. */
export function sanitizeDisplayName(name: string | undefined | null): string | null {
  if (!name) return null;
  const cleaned = name.replace(/["\\<>\r\n\x00-\x1f\x7f]/g, "").trim();
  return cleaned.length > 0 ? cleaned.slice(0, 100) : null;
}

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .replace(/[/\\:*?"<>|\r\n\x00-\x1f\x7f]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned.length > 0 ? cleaned : "resume.pdf").slice(0, 120);
}

/**
 * Format an RFC 5322 mailbox address header (From / To).
 * RFC 2047 §5 explicitly forbids encoded-words inside addr-spec (<email>).
 * If the display name contains non-ASCII characters, only the display name phrase
 * is encoded with RFC 2047, leaving the addr-spec untouched.
 */
export function formatAddressHeader(name: string | undefined | null, email: string): string {
  const sanitized = sanitizeDisplayName(name);
  if (!sanitized) return `<${email}>`;
  // RFC 2047: encoded-words must not appear in a quoted string.
  // eslint-disable-next-line no-control-regex
  if (!/^[\x20-\x7e]*$/.test(sanitized) || sanitized.includes("=?")) {
    return `${encodeHeaderValue(sanitized)} <${email}>`;
  }
  return `"${sanitized}" <${email}>`;
}

/** RFC 2047 encoded-word for non-ASCII headers (B-encoding).
 * Encoded values are returned unfolded: B-words contain no spaces to fold on,
 * and a ≤160-char subject stays far below the RFC 5322 998-char line limit. */
export function encodeHeaderValue(value: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7e]*$/.test(value) && !value.includes("=?")) return value;
  const encoded = Buffer.from(value, "utf8").toString("base64");
  return `=?UTF-8?B?${encoded}?=`;
}

function foldHeader(name: string, value: string): string {
  const full = `${name}: ${value}`;
  // Never fold encoded-words (no safe fold points); fold long ASCII values.
  if (full.length <= 78 || value.includes("=?")) return full;
  const words = value.split(" ");
  const lines: string[] = [];
  let current = `${name}: `;
  for (const word of words) {
    if ((current + word).length > 76 && current.trim().length > 0) {
      lines.push(current.trimEnd());
      current = ` ${word}`;
    } else {
      current += (current.endsWith(": ") || current === ` ${word}` ? "" : " ") + word;
    }
  }
  if (current.trim().length > 0) lines.push(current.trimEnd());
  return lines.join("\r\n");
}

function base64Wrap(bytes: Uint8Array): string {
  const b64 = Buffer.from(bytes).toString("base64");
  const lines: string[] = [];
  for (let i = 0; i < b64.length; i += MAX_LINE) lines.push(b64.slice(i, i + MAX_LINE));
  return lines.join("\r\n");
}

export type MimeInput = {
  fromEmail: string;
  fromName?: string | null;
  toEmail: string;
  toName?: string | null;
  subject: string;
  body: string;
  attachment?: { filename: string; bytes: Uint8Array; contentType: string } | null;
  /** Opaque reconciliation marker header — no PII (§16.4). */
  operationMarker: string;
};

export type MimeOutput = {
  /** RFC 5322 message with CRLF line endings. */
  raw: string;
  /** Gmail API expects base64url of the raw message. */
  rawBase64Url: string;
  byteSize: number;
};

export function buildMimeMessage(input: MimeInput): MimeOutput {
  const from = validateEmailAddress(input.fromEmail);
  if (!from.ok) throw new Error(`INVALID_FROM: ${from.reason}`);
  const to = validateEmailAddress(input.toEmail);
  if (!to.ok) throw new Error(`INVALID_TO: ${to.reason}`);

  const subject = input.subject.replace(/[\r\n\x00-\x1f\x7f]/g, " ").trim();
  const marker = input.operationMarker.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);

  const boundary = `=_ab_${Buffer.from(crypto.randomUUID()).toString("hex")}`;

  const headers: Array<[string, string]> = [
    ["From", formatAddressHeader(input.fromName, input.fromEmail)],
    ["To", formatAddressHeader(input.toName, input.toEmail)],
    ["Subject", encodeHeaderValue(subject)],
    ["Date", new Date().toUTCString().replace("GMT", "+0000")],
    ["MIME-Version", "1.0"],
    ["X-ApplyBee-Operation", marker],
    ["Message-ID", `<${marker}.${Date.now()}@applybee.local>`],
  ];

  let content: string;
  if (input.attachment) {
    content = [
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      input.body.replace(/\r?\n/g, "\r\n"),
      `--${boundary}`,
      `Content-Type: ${input.attachment.contentType}; name="${sanitizeFilename(input.attachment.filename)}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${sanitizeFilename(input.attachment.filename)}"`,
      "",
      base64Wrap(input.attachment.bytes),
      `--${boundary}--`,
      "",
    ].join("\r\n");
  } else {
    content = [
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      input.body.replace(/\r?\n/g, "\r\n"),
    ].join("\r\n");
  }

  const raw = headers.map(([n, v]) => foldHeader(n, v)).join("\r\n") + "\r\n" + content;

  return {
    raw,
    rawBase64Url: Buffer.from(raw, "utf8").toString("base64url"),
    byteSize: Buffer.byteLength(raw, "utf8"),
  };
}
