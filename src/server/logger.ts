/**
 * Structured logger (§29.1). Never log OAuth tokens, resume text, email
 * bodies, full email addresses, signed URLs, or complete payment payloads.
 */
type Level = "debug" | "info" | "warn" | "error";

const REDACT_KEYS = [
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "code",
  "state",
  "password",
  "secret",
  "email",
  "body",
  "subject",
  "resume",
  "payload",
  "signature",
  "verifier",
  "cookie",
];

function scrub(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (depth > 4 || value === null || typeof value !== "object") {
    if (typeof value === "string" && value.length > 300) {
      return `${value.slice(0, 60)}…<redacted ${value.length} chars>`;
    }
    return value;
  }

  if (seen.has(value)) {
    return "[circular]";
  }
  seen.add(value);

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: process.env.APP_ENV === "development" ? value.stack : undefined,
      ...(value.cause ? { cause: scrub(value.cause, depth + 1, seen) } : {}),
    };
  }

  if (Array.isArray(value)) return value.slice(0, 20).map((v) => scrub(v, depth + 1, seen));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = REDACT_KEYS.some((r) => k.toLowerCase().includes(r)) ? "[redacted]" : scrub(v, depth + 1, seen);
  }
  return out;
}

function emit(level: Level, message: string, meta?: Record<string, unknown>) {
  try {
    const line = {
      ts: new Date().toISOString(),
      level,
      msg: message,
      ...(meta ? (scrub(meta) as Record<string, unknown>) : {}),
    };
    const serialized = JSON.stringify(line);
    if (level === "error") console.error(serialized);
    else if (level === "warn") console.warn(serialized);
    else console.log(serialized);
  } catch (err) {
    console.error(`[logger-fallback] ${level}: ${message}`, meta, err);
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) =>
    process.env.APP_ENV === "development" && emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
};
