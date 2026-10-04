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
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_MIGRATION_URL: z.string().optional(),

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

  GEMINI_API_KEY: optional(z.string().min(1)),
  GEMINI_MODEL_ID: optional(z.string().min(1)),
  AI_PROMPT_VERSION: z.string().default("2026-10-04.1"),
  AI_DAILY_COST_BUDGET_INR: z.coerce.number().default(500),

  RAZORPAY_KEY_ID: optional(z.string().min(1)),
  RAZORPAY_KEY_SECRET: optional(z.string().min(1)),
  RAZORPAY_WEBHOOK_SECRET: optional(z.string().min(1)),
  PAYMENTS_MODE: z.enum(["test", "live"]).default("test"),

  OBJECT_STORE_PROVIDER: z.enum(["local", "s3", "r2"]).default("local"),
  PRIVATE_QUARANTINE_BUCKET: z.string().default(".data/private/quarantine"),
  PRIVATE_CLEAN_BUCKET: z.string().default(".data/private/clean"),
  PRIVATE_EXPORT_BUCKET: z.string().default(".data/private/export"),

  DOCUMENT_PROCESSOR_ENDPOINT: optional(z.string().url()),
  DOCUMENT_PROCESSOR_SIGNING_SECRET: optional(z.string().min(1)),

  SENTRY_DSN: optional(z.string().url()),
  TRANSACTIONAL_EMAIL_FROM: optional(z.string().min(3)),

  FEATURE_AI_ENABLED: boolFlag("FEATURE_AI_ENABLED", true),
  FEATURE_GMAIL_ENABLED: boolFlag("FEATURE_GMAIL_ENABLED", true),
  FEATURE_LIVE_PURCHASES_ENABLED: boolFlag("FEATURE_LIVE_PURCHASES_ENABLED", false),
  FEATURE_RESUME_ATTACHMENTS_ENABLED: boolFlag("FEATURE_RESUME_ATTACHMENTS_ENABLED", true),
});

export type AppConfig = z.infer<typeof envSchema> & {
  isProduction: boolean;
  authMode: "clerk" | "dev";
  aiMode: "gemini" | "mock";
  gmailMode: "live" | "mock";
  paymentsMode: "razorpay" | "mock";
};

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration — ${issues}`);
  }
  const env = parsed.data;
  const isProduction = env.APP_ENV === "production";

  const authMode: "clerk" | "dev" =
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY ? "clerk" : "dev";
  const aiMode: "gemini" | "mock" = env.GEMINI_API_KEY ? "gemini" : "mock";
  const gmailMode: "live" | "mock" =
    env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET ? "live" : "mock";
  const paymentsMode: "razorpay" | "mock" =
    env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET ? "razorpay" : "mock";

  if (isProduction && authMode === "dev") {
    throw new Error("Production requires a real authentication provider (Clerk).");
  }
  if (isProduction && aiMode === "mock") {
    // The plan requires production AI to use an approved provider; mock stays
    // for staging/demo with explicit labeling.
    console.warn("[config] AI mock adapter active in production — verify intentionally.");
  }

  cached = Object.assign(env, {
    isProduction,
    authMode,
    aiMode,
    gmailMode,
    paymentsMode,
  });
  return cached;
}
