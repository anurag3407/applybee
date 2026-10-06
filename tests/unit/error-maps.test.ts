import { describe, it, expect } from "vitest";
import { errorResponse } from "@/server/http";
import { CreditError } from "@/server/services/credits";
import { OrderError } from "@/server/services/billing";
import { UploadError } from "@/server/services/resumes";
import { GenerationPreflightError } from "@/server/services/generations";
import { DeliveryPreflightError } from "@/server/services/gmail";
import { RevealError } from "@/server/services/contacts";
import { OpportunityError } from "@/server/services/opportunities";

/**
 * The error → HTTP contract (§19.1): each domain error class resolves its own
 * envelope through `apiErrorSpec()`; codes it declines go to the generic table
 * in `errorResponse`. Every row pins [owner, thrown code → status] plus the
 * envelope code/message when they differ from the thrown ones; every other row
 * asserts the owner echoes its code and its human copy.
 */
const COPY = "human copy";
const GENERIC_500 = "Something went wrong. Please try again.";

class Err {}
type ErrCtor = new (code: string, message: string, ...rest: any[]) => Err;

const OWNERS = {
  Order: OrderError,
  Upload: UploadError,
  Generation: GenerationPreflightError,
  Delivery: DeliveryPreflightError,
  Reveal: RevealError,
  Opportunity: OpportunityError,
} satisfies Record<string, ErrCtor>;

async function envelope(err: unknown) {
  const res = errorResponse(err);
  const body = (await res.json()) as { error: Record<string, unknown> };
  return {
    status: res.status,
    code: body.error.code,
    message: body.error.message,
    retryable: body.error.retryable,
    fieldErrors: body.error.fieldErrors,
    requestId: body.error.requestId,
    retryAfter: res.headers.get("retry-after"),
    cacheControl: res.headers.get("cache-control"),
  };
}

type Row = [owner: keyof typeof OWNERS, code: string, status: number, envelopeCode?: string, envelopeMessage?: string];

const CONTRACT: Row[] = [
  // OrderError (billing) — ORDER_STATUS, unmapped codes default to 400
  ["Order", "RATE_LIMITED", 429],
  ["Order", "SALES_DISABLED", 403],
  ["Order", "CATALOG_UNAVAILABLE", 503],
  ["Order", "IDEMPOTENCY_CONFLICT", 409],
  ["Order", "ORDER_NOT_FOUND", 404],
  ["Order", "INVALID_SIGNATURE", 400],
  ["Order", "INTERNAL", 400],
  // UploadError (resumes) — UPLOAD_STATUS, unmapped codes default to 400
  ["Upload", "RATE_LIMITED", 429],
  ["Upload", "QUOTA_EXCEEDED", 409],
  ["Upload", "UPLOADS_DISABLED", 503],
  ["Upload", "INTENT_INVALID", 400],
  ["Upload", "INTENT_EXPIRED", 400],
  ["Upload", "EMPTY_FILE", 400],
  ["Upload", "FILE_TOO_LARGE", 400],
  ["Upload", "ENCRYPTED_PDF", 400],
  ["Upload", "INVALID_PDF", 400],
  // GenerationPreflightError (generations) — GENERATION_STATUS
  ["Generation", "INSUFFICIENT_AI_CREDITS", 409],
  ["Generation", "DRAFT_INACTIVE", 409],
  ["Generation", "IDEMPOTENCY_CONFLICT", 409],
  ["Generation", "DRAFT_NOT_FOUND", 404],
  ["Generation", "NO_CONFIRMED_FACTS", 422],
  ["Generation", "NO_RECIPIENT", 422],
  ["Generation", "RATE_LIMITED", 429],
  ["Generation", "DAILY_LIMIT_REACHED", 429],
  ["Generation", "AI_DISABLED", 503],
  ["Generation", "INTERNAL", 500],
  // …and codes it has no opinion about fall to the generic table
  ["Generation", "GENERATION_NOT_FOUND", 500, "INTERNAL", GENERIC_500],
  // DeliveryPreflightError (gmail) — DELIVERY_PREFLIGHT_STATUS, unmapped → 409
  ["Delivery", "NOT_CONNECTED", 409],
  ["Delivery", "CONTACT_LOCKED", 409],
  ["Delivery", "APPROVAL_INVALID", 409],
  ["Delivery", "RECIPIENT_SUPPRESSED", 422],
  ["Delivery", "NO_RECIPIENT", 422],
  ["Delivery", "NO_REVISION", 422],
  ["Delivery", "RATE_LIMITED", 429],
  ["Delivery", "GMAIL_DISABLED", 503],
  ["Delivery", "DELIVERY_NOT_FOUND", 404],
  ["Delivery", "DRAFT_NOT_FOUND", 404],
  ["Delivery", "DAILY_LIMIT_REACHED", 409],
  // RevealError (contacts) — sentinel envelopes for two codes, generic table otherwise
  ["Reveal", "RATE_LIMITED", 429, "RATE_LIMITED", "RATE_LIMITED"],
  ["Reveal", "IDEMPOTENCY_CONFLICT", 409, "CONFLICT", "CONFLICT"],
  ["Reveal", "CONTACT_NOT_FOUND", 500, "INTERNAL", GENERIC_500],
  ["Reveal", "CONTACT_INVALID", 500, "INTERNAL", GENERIC_500],
  // OpportunityError (opportunities)
  ["Opportunity", "NOT_FOUND", 404, "NOT_FOUND", "NOT_FOUND"],
  ["Opportunity", "EMPTY_NOTE", 500, "INTERNAL", GENERIC_500],
];

describe("error → HTTP contract", () => {
  it.each(CONTRACT)("%s %s → %i", async (owner, code, status, envelopeCode, envelopeMessage) => {
    const e = await envelope(new OWNERS[owner](code, COPY));
    expect(e).toMatchObject({
      status,
      code: envelopeCode ?? code,
      message: envelopeMessage ?? COPY,
      retryAfter: null,
    });
  });

  it("keeps the shared envelope shape on every path", async () => {
    for (const err of [new OrderError("RATE_LIMITED", COPY), new RevealError("CONTACT_NOT_FOUND", COPY), new Error("UNAUTHORIZED")]) {
      const e = await envelope(err);
      expect(e.retryable).toBe(false);
      expect(e.fieldErrors).toEqual({});
      expect(e.requestId).toMatch(/^[0-9a-f-]{36}$/);
      expect(e.cacheControl).toBe("private, no-store");
    }
  });

  it("still maps plain sentinels through the generic table", async () => {
    const e = await envelope(new Error("UNAUTHORIZED"));
    expect(e).toMatchObject({ status: 401, code: "UNAUTHENTICATED", message: "UNAUTHORIZED" });
  });

  it("still maps CreditError to 409 with the service's code and message", async () => {
    const e = await envelope(new CreditError("INSUFFICIENT_AI_CREDITS", "You need one credit."));
    expect(e).toMatchObject({ status: 409, code: "INSUFFICIENT_AI_CREDITS", message: "You need one credit." });
  });

  it("passes Retry-After only when the thrower supplied one", async () => {
    const limited = await envelope(new GenerationPreflightError("RATE_LIMITED", COPY, 60));
    expect(limited.retryAfter).toBe("60");
    const credits = await envelope(new GenerationPreflightError("INSUFFICIENT_AI_CREDITS", COPY));
    expect(credits.retryAfter).toBeNull();
    // The Reveal sentinel path drops its thrower-supplied value, by contract.
    const reveal = await envelope(new RevealError("RATE_LIMITED", COPY, 30));
    expect(reveal.retryAfter).toBeNull();
  });

  it("stamps every approvals-endpoint preflight failure as a conflict", async () => {
    const e = await envelope(new DeliveryPreflightError("RATE_LIMITED", COPY, 409));
    expect(e).toMatchObject({ status: 409, code: "RATE_LIMITED", message: COPY });
  });
});
