/**
 * Shared validation contracts (§7, §19.4). Client forms mirror these bounds;
 * every server mutation validates untrusted input through Zod.
 */
import { z } from "zod";

export const SUBJECT_MAX = 160;
export const BODY_MAX_CHARS = 20_000;
export const BODY_MAX_WORDS = 1_000;
export const NOTE_MAX = 5_000;
export const JOB_DESCRIPTION_MAX = 20_000;
export const TEMPLATE_BODY_MAX = 20_000;
export const SUPPORT_MESSAGE_MAX = 5_000;
export const QUERY_MAX = 200;

export const safeEmail = z
  .string()
  .trim()
  .min(3)
  .max(254)
  // Bounded supported address policy: reject control characters and header
  // injection (§30.2). Full RFC 5321 validation happens at MIME build time.
  .refine((v) => !/[\r\n\x00-\x1f\x7f]/.test(v), "Email contains invalid characters")
  .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email address");

export const safeUrl = z
  .string()
  .trim()
  .max(2_000)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Use an http(s) URL");

/**
 * Safe same-origin return path for auth redirects (§11.3): rejects absolute
 * URLs, protocol-relative URLs (`//evil.example`), backslash tricks, and
 * control characters. Accepts a same-origin path or returns null.
 */
export function safeInternalPath(value: unknown): string | null {
  // Search params can arrive as arrays (`?next=a&next=b`); only a single
  // string value is ever a valid return path.
  if (typeof value !== "string" || !value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("\\")) return null;
  if (/[\r\n\x00-\x1f\x7f]/.test(value)) return null;
  return value;
}

export const subjectSchema = z.string().max(SUBJECT_MAX);
export const bodySchema = z
  .string()
  .max(BODY_MAX_CHARS)
  .refine((v) => v.trim().split(/\s+/).filter(Boolean).length <= BODY_MAX_WORDS, {
    message: `Body must stay under ${BODY_MAX_WORDS} words`,
  });

export const intentSchema = z.enum(["advertised_role", "internship", "intro", "referral", "follow_up"]);
export const modeSchema = z.enum(["manual", "quick_ai", "agentic"]);
export const toneSchema = z.enum(["warm_professional", "direct", "formal", "concise"]);
export const lengthSchema = z.object({
  target: z.number().int().min(60).max(180).default(90),
});

export const recipientSchema = z.union([
  z.object({ kind: z.literal("directory"), contactId: z.string().uuid() }),
  z.object({
    kind: z.literal("own"),
    email: safeEmail,
    name: z.string().trim().max(120).optional(),
  }),
  // Explicit clear, so removing a recipient is a distinct intent rather than
  // an empty string that happens to be falsy.
  z.object({ kind: z.literal("none") }),
]);

export const generationInputSchema = z.object({
  intent: intentSchema,
  targetRole: z.string().trim().max(120).optional(),
  jobDescription: z.string().max(JOB_DESCRIPTION_MAX).optional(),
  tone: toneSchema.default("warm_professional"),
  length: lengthSchema,
  priorOutreachContext: z.string().max(2_000).optional(),
});

export const draftPatchSchema = z.object({
  expectedVersion: z.number().int().min(0),
  subject: subjectSchema.optional(),
  body: bodySchema.optional(),
  intent: intentSchema.optional(),
  mode: modeSchema.optional(),
  recipient: recipientSchema.optional(),
  attachmentResumeId: z.string().uuid().nullable().optional(),
});

export const templateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  subject: subjectSchema,
  body: z.string().max(TEMPLATE_BODY_MAX),
});

export const opportunitySchema = z.object({
  companyName: z.string().trim().min(1).max(160),
  roleTitle: z.string().trim().min(1).max(160),
  jobUrl: safeUrl.optional().or(z.literal("")),
  stage: z
    .enum(["interested", "draft_ready", "applied_or_contacted", "conversation", "interview", "offer", "closed"])
    .optional(),
  nextActionAt: z.string().datetime({ offset: true }).nullable().optional(),
  nextActionNote: z.string().max(500).optional(),
  contactId: z.string().uuid().nullable().optional(),
  draftId: z.string().uuid().nullable().optional(),
  source: z.string().max(300).optional(),
});

export const profileFactSchema = z.object({
  factType: z.enum(["experience", "project", "education", "skill", "achievement", "link", "summary"]),
  text: z.string().trim().min(3).max(600),
  numericValue: z.number().int().nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
});

export const profileRevisionSchema = z.object({
  summary: z.string().max(600).optional(),
  targetRole: z.string().trim().max(120).optional(),
  careerStage: z.enum(["student", "early_career", "experienced", "career_switcher"]).optional(),
  facts: z.array(profileFactSchema).max(40),
  approve: z.boolean().default(true),
});

export const supportRequestSchema = z.object({
  email: safeEmail,
  category: z.enum(["account", "credits", "gmail", "resume", "contact_data", "bug", "other"]),
  message: z.string().trim().min(20).max(SUPPORT_MESSAGE_MAX),
  reference: z.string().max(100).optional(),
});

export const contactDataRequestSchema = z.object({
  email: safeEmail,
  requestType: z.enum(["removal", "correction"]),
  details: z.string().trim().min(10).max(2_000),
});

/** Known template placeholder variables (§13.2). */
export const TEMPLATE_VARIABLES = [
  "candidate_name",
  "recipient_first_name",
  "company_name",
  "target_role",
  "achievement",
  "portfolio_url",
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

export function findUnknownTemplateVariables(body: string, subject: string): string[] {
  const known = new Set<string>(TEMPLATE_VARIABLES);
  const found = `${subject}\n${body}`.match(/\{\{\s*([a-z_]+)\s*\}\}/g) ?? [];
  return [...new Set(found.map((m) => m.replace(/[{}\s]/g, "")))].filter((v) => !known.has(v));
}

export function fillTemplate(
  text: string,
  values: Partial<Record<TemplateVariable, string>>,
): { filled: string; missing: TemplateVariable[] } {
  const missing: TemplateVariable[] = [];
  const filled = text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_m, raw: string) => {
    const key = raw as TemplateVariable;
    if (!(TEMPLATE_VARIABLES as readonly string[]).includes(key)) return _m;
    const value = values[key];
    if (value === undefined || value === "") {
      if (!missing.includes(key)) missing.push(key);
      return `{{${key}}}`;
    }
    return value;
  });
  return { filled, missing };
}
