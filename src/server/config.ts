/**
 * Server-only configuration resolved through a Zod schema at startup (§27.1).
 * Missing optional secrets disable the corresponding feature honestly;
 * invalid values fail fast. Nothing here may be imported from client code.
 */
import { z } from "zod";

const optional = (schema: z.ZodString) =>
  z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? schema.parse(v) : undefined));

const boolFlag = (name: string, fallback: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? fallback : v === "true"))
    .refine((v) => typeof v === "boolean", { message: `${name} must be true/false` });

const envSchema = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  // Extra browser origins that are allowed to make cookie-authenticated
  // mutations. Needed when a deployment serves more than one custom domain —
  // without it a user who lands on a non-canonical host is locked out of every
  // form with FORBIDDEN_ORIGIN. Comma-separated absolute URLs.
  EXTRA_ALLOWED_ORIGINS: z.string().optional(),
  DATABASE_URL: z.string().default("postgresql://localhost:5432/applybee_dev"),
  DATABASE_MIGRATION_URL: z.string().optional(),

  AUTH_MODE: z.enum(["clerk", "dev"]).optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: optional(z.string().min(1)),
  CLERK_SECRET_KEY: optional(z.string().min(1)),
  CLERK_WEBHOOK_SIGNING_SECRET: optional(z.string().min(1)),

  UPSTASH_REDIS_REST_URL: optional(z.string().url()),
  UPSTASH_REDIS_REST_TOKEN: optional(z.string().min(1)),

  GOOGLE_OAUTH_CLIENT_ID: optional(z.string().min(1)),
  GOOGLE_OAUTH_CLIENT_SECRET: optional(z.string().min(1)),
  GOOGLE_OAUTH_REDIRECT_URI: optional(z.string().url()),

  TOKEN_ENCRYPTION_KEY_VERSION: z.string().default("1"),
  // Dev fallback key is derived deterministically and labeled; production
  // requires an explicit 32-byte base64 key.
  TOKEN_ENCRYPTION_KEY: optional(z.string().min(1)),
  // Retired keys, kept so envelopes written before a rotation still decrypt.
  // Set TOKEN_ENCRYPTION_KEY_V1 to the previous key, bump TOKEN_ENCRYPTION_KEY_VERSION,
  // and put the new key in TOKEN_ENCRYPTION_KEY — old data keeps working.
  TOKEN_ENCRYPTION_KEY_V1: optional(z.string().min(1)),
  TOKEN_ENCRYPTION_KEY_V2: optional(z.string().min(1)),

  OPENROUTER_API_KEY: optional(z.string().min(1)),
  // An empty-string env var must behave like an unset one, or a blank
  // OPENROUTER_MODEL_ID silently ships an empty model to the provider.
  OPENROUTER_MODEL_ID: z.preprocess((v) => (v === "" ? undefined : v), z.string().default("openrouter/free")),
  IS_OPENROUTER: z
    .string()
    .optional()
    .default(() => process.env.isOpenrouter ?? process.env.isOpenRouter ?? "")
    .transform((v) => (v === "" || v === undefined ? true : v.toLowerCase() === "true" || v === "1")),
  AI_PROVIDER: z.enum(["openrouter", "gemini", "mock"]).optional(),

  GEMINI_API_KEY: optional(z.string().min(1)),
  GEMINI_MODEL_ID: optional(z.string().min(1)),
  AI_PROMPT_VERSION: z.string().default("2026-10-04.1"),
  AI_DAILY_COST_BUDGET_INR: z.coerce.number().default(500),

  RAZORPAY_KEY_ID: optional(z.string().min(1)),
  RAZORPAY_KEY_SECRET: optional(z.string().min(1)),
  RAZORPAY_WEBHOOK_SECRET: optional(z.string().min(1)),
  PAYMENTS_MODE: z.enum(["test", "live"]).default("test"),

  OBJECT_STORE_PROVIDER: z.enum(["local", "s3", "r2", "appwrite", "supabase", "neon"]).default("neon"),
  IS_NEON: boolFlag("IS_NEON", true),
  IS_NEON_DB: boolFlag("IS_NEON_DB", true),
  CLOUDFLARE_R2: boolFlag("CLOUDFLARE_R2", false),
  APPWRITE_STORAGE: boolFlag("APPWRITE_STORAGE", false),
  SUPABASE_STORAGE: boolFlag("SUPABASE_STORAGE", false),

  APPWRITE_ENDPOINT: optional(z.string().url()),
  APPWRITE_PROJECT_ID: optional(z.string().min(1)),
  APPWRITE_API_KEY: optional(z.string().min(1)),
  APPWRITE_BUCKET_ID: z.string().default("resumes"),

  SUPABASE_URL: optional(z.string().url()),
  SUPABASE_SERVICE_ROLE_KEY: optional(z.string().min(1)),
  SUPABASE_STORAGE_BUCKET: z.string().default("resumes"),

  CLOUDFLARE_R2_ACCESS_KEY_ID: optional(z.string().min(1)),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: optional(z.string().min(1)),
  CLOUDFLARE_R2_ENDPOINT: optional(z.string().url()),
  CLOUDFLARE_R2_BUCKET: z.string().default("resumes"),

  PRIVATE_QUARANTINE_BUCKET: z.string().default(".data/private/quarantine"),
  PRIVATE_CLEAN_BUCKET: z.string().default(".data/private/clean"),
  PRIVATE_EXPORT_BUCKET: z.string().default(".data/private/export"),

  DOCUMENT_PROCESSOR_ENDPOINT: optional(z.string().url()),
  DOCUMENT_PROCESSOR_SIGNING_SECRET: optional(z.string().min(1)),

  SENTRY_DSN: optional(z.string().url()),
  // Shared secret for the scheduler endpoint (src/app/api/v1/cron/*). The
  // deployed Worker has no timer, so an external scheduler calls in with this
  // bearer token to drive the durable job queue and the daily digest.
  CRON_SECRET: optional(z.string().min(16)),
  RESEND_API_KEY: optional(z.string().min(1)),
  TRANSACTIONAL_EMAIL_FROM: z.string().default("ReachBee <team@sayalabs.in>"),

  FEATURE_AI_ENABLED: boolFlag("FEATURE_AI_ENABLED", true),
  FEATURE_GMAIL_ENABLED: boolFlag("FEATURE_GMAIL_ENABLED", true),
  FEATURE_LIVE_PURCHASES_ENABLED: boolFlag("FEATURE_LIVE_PURCHASES_ENABLED", false),
  FEATURE_RESUME_ATTACHMENTS_ENABLED: boolFlag("FEATURE_RESUME_ATTACHMENTS_ENABLED", true),
});

export type AppConfig = z.infer<typeof envSchema> & {
  isProduction: boolean;
  authMode: "clerk" | "dev";
  aiMode: "openrouter" | "gemini" | "mock";
  gmailMode: "live" | "mock";
  paymentsMode: "razorpay" | "mock";
  storageMode: "r2" | "appwrite" | "supabase" | "neon" | "local";
  /** Every browser origin permitted to make cookie-authenticated mutations. */
  allowedOrigins: string[];
};

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration, ${issues}`);
  }
  const env = parsed.data;
  const isProduction = env.APP_ENV === "production";

  const authMode: "clerk" | "dev" =
    env.AUTH_MODE ?? (env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY ? "clerk" : "dev");

  // AI Priority: if IS_OPENROUTER=true (or isOpenrouter=true) or AI_PROVIDER="openrouter",
  // openrouter is primary. Otherwise gemini is primary.
  let aiMode: "openrouter" | "gemini" | "mock" = "mock";
  const isOpenrouter =
    env.IS_OPENROUTER ||
    process.env.isOpenrouter === "true" ||
    process.env.isOpenRouter === "true" ||
    env.AI_PROVIDER === "openrouter";

  if (env.AI_PROVIDER === "gemini" && env.GEMINI_API_KEY) {
    aiMode = "gemini";
  } else if (isOpenrouter && env.OPENROUTER_API_KEY) {
    aiMode = "openrouter";
  } else if (env.GEMINI_API_KEY) {
    aiMode = "gemini";
  } else if (env.OPENROUTER_API_KEY) {
    aiMode = "openrouter";
  } else {
    aiMode = "mock";
  }

  const gmailMode: "live" | "mock" =
    env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET ? "live" : "mock";
  const paymentsMode: "razorpay" | "mock" =
    env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET ? "razorpay" : "mock";

  // Priority: cloudflare > appwrite > supabase > neon > local
  let storageMode: "r2" | "appwrite" | "supabase" | "neon" | "local" = "local";
  if (env.CLOUDFLARE_R2 || env.OBJECT_STORE_PROVIDER === "r2") {
    storageMode = "r2";
  } else if (
    env.APPWRITE_STORAGE ||
    env.OBJECT_STORE_PROVIDER === "appwrite" ||
    (env.APPWRITE_ENDPOINT && env.APPWRITE_PROJECT_ID && env.APPWRITE_API_KEY)
  ) {
    storageMode = "appwrite";
  } else if (
    env.SUPABASE_STORAGE ||
    env.OBJECT_STORE_PROVIDER === "supabase" ||
    (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)
  ) {
    storageMode = "supabase";
  } else if (
    env.IS_NEON ||
    env.IS_NEON_DB ||
    env.OBJECT_STORE_PROVIDER === "neon"
  ) {
    storageMode = "neon";
  } else if (env.OBJECT_STORE_PROVIDER === "local") {
    storageMode = "local";
  } else {
    storageMode = "neon";
  }

  if (isProduction && aiMode === "mock") {
    // The plan requires production AI to use an approved provider; mock stays
    // for staging/demo with explicit labeling.
    console.warn("[config] AI mock adapter active in production, verify intentionally.");
  }

  // Every browser origin that may perform a cookie-authenticated mutation.
  // The canonical base URLs are always allowed; EXTRA_ALLOWED_ORIGINS covers
  // additional custom domains the same deployment answers on.
  const allowedOrigins = new Set<string>();
  for (const candidate of [env.APP_BASE_URL, env.NEXT_PUBLIC_APP_URL]) {
    if (!candidate) continue;
    allowedOrigins.add(candidate);
    allowedOrigins.add(new URL(candidate).host);
  }
  for (const extra of (env.EXTRA_ALLOWED_ORIGINS ?? "").split(",")) {
    const trimmed = extra.trim();
    if (!trimmed) continue;
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") continue;
      allowedOrigins.add(parsed.origin);
      allowedOrigins.add(parsed.host);
    } catch {
      // Ignore malformed entries rather than silently widening trust.
    }
  }

  if (isProduction) {
    // Production must fail fast on an incomplete configuration. Previously
    // these were console.warn calls, so a deployment missing its database or
    // encryption key booted into a silently broken state.
    //
    // Only conditions that make the whole app unsafe or unusable are fatal.
    // A missing secret that degrades a single feature is reported loudly below
    // instead, so one unconfigured integration cannot take every page down.
    const issues: string[] = [];
    if (authMode !== "clerk") {
      issues.push(
        "authMode resolved to 'dev', set CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (or AUTH_MODE=clerk).",
      );
    }
    if (!env.DATABASE_URL || /localhost|127\.0\.0\.1/.test(env.DATABASE_URL)) {
      issues.push("DATABASE_URL is unset or points at localhost.");
    }
    if (!env.TOKEN_ENCRYPTION_KEY) {
      issues.push("TOKEN_ENCRYPTION_KEY is unset, contact emails and OAuth tokens would fall back to a public derived key.");
    } else if (Buffer.from(env.TOKEN_ENCRYPTION_KEY, "base64").length !== 32) {
      issues.push("TOKEN_ENCRYPTION_KEY is not a 32-byte base64 key.");
    }
    if (issues.length > 0) {
      throw new Error(
        `Refusing to start with an incomplete production configuration:\n- ${issues.join("\n- ")}`,
      );
    }

    // Degraded-feature warnings. These do not block boot, but each one is a
    // concrete launch gap and must not be discovered by a user.
    const degraded: string[] = [];
    if (!env.CLERK_WEBHOOK_SIGNING_SECRET) {
      degraded.push("CLERK_WEBHOOK_SIGNING_SECRET unset, Clerk webhooks rejected; account changes rely on first-request provisioning.");
    }
    if (!env.CRON_SECRET) {
      degraded.push("CRON_SECRET unset, nothing can drive the job queue or the daily digest; the deployed Worker has no timer.");
    }
    if (env.FEATURE_GMAIL_ENABLED && !(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET)) {
      degraded.push("FEATURE_GMAIL_ENABLED=true but GOOGLE_OAUTH_CLIENT_ID/SECRET unset, Gmail connect is unavailable.");
    } else if (env.FEATURE_GMAIL_ENABLED && !env.GOOGLE_OAUTH_REDIRECT_URI) {
      degraded.push("GOOGLE_OAUTH_REDIRECT_URI unset, Gmail connect cannot build a callback URL.");
    }
    if (env.FEATURE_LIVE_PURCHASES_ENABLED && !env.RAZORPAY_WEBHOOK_SECRET) {
      degraded.push("FEATURE_LIVE_PURCHASES_ENABLED=true but RAZORPAY_WEBHOOK_SECRET unset, every payment webhook is rejected.");
    }
    if (env.PAYMENTS_MODE === "live" && !(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET)) {
      degraded.push("PAYMENTS_MODE=live but Razorpay keys unset.");
    }
    if (!env.RESEND_API_KEY) {
      degraded.push("RESEND_API_KEY unset, transactional email and the daily digest cannot be delivered.");
    }
    if (aiMode === "mock") {
      degraded.push("aiMode resolved to 'mock', no OPENROUTER_API_KEY or GEMINI_API_KEY is set, so every AI draft is sample output.");
    }
    if (env.FEATURE_RESUME_ATTACHMENTS_ENABLED && !(env.DOCUMENT_PROCESSOR_ENDPOINT && env.DOCUMENT_PROCESSOR_SIGNING_SECRET)) {
      degraded.push(
        "DOCUMENT_PROCESSOR_ENDPOINT/SIGNING_SECRET unset, uploaded resumes are marked clean on structural PDF checks alone; no malware scan runs.",
      );
    }
    if (degraded.length > 0) {
      console.error(`[config] PRODUCTION DEGRADED, ${degraded.length} issue(s):\n- ${degraded.join("\n- ")}`);
    }
  }

  cached = Object.assign(env, {
    isProduction,
    authMode,
    aiMode,
    gmailMode,
    paymentsMode,
    storageMode,
    allowedOrigins: [...allowedOrigins],
  });
  return cached;
}
