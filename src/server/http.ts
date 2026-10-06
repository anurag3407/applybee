import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { CreditError } from "@/server/services/credits";
import { getConfig } from "@/server/config";
import { logger } from "@/server/logger";
import { randomUUID } from "node:crypto";

/**
 * API conventions (§19.1): /api/v1 namespace, stable error codes, safe
 * request ids, 202 for async creation, Retry-After on 429/503. User id always
 * derives from auth — never from body or query.
 */

export function ok<T extends object>(data: T, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(
    { data, meta: { requestId: randomUUID() } },
    { status, headers: { "Cache-Control": "private, no-store", ...headers } },
  );
}

export function accepted<T extends object>(data: T) {
  return ok(data, 202);
}

/**
 * Status a domain error owns itself (§19.1). Errors that expose
 * `apiErrorSpec()` decide their own envelope here — one owner, so route
 * handlers never translate codes to statuses. `undefined` means "no opinion
 * for this code": the generic sentinel table below decides instead.
 */
export type DomainErrorSpec = {
  status: number;
  code: string;
  message: string;
  retryAfter?: number;
};

function domainErrorSpec(err: unknown): DomainErrorSpec | undefined {
  if (!(err instanceof Error)) return undefined;
  const spec = (err as Error & { apiErrorSpec?: () => DomainErrorSpec | undefined }).apiErrorSpec;
  return typeof spec === "function" ? spec.call(err) : undefined;
}

/**
 * Wrap a route handler so every thrown error becomes the stable envelope
 * (§19.1). Handlers keep their own typed signature; mapping that is specific
 * to a domain error stays in the handler's own catch, because those messages
 * are human copy rather than the sentinel codes `errorResponse` matches on.
 */
export function route<Args extends unknown[], Result extends Response>(
  handler: (...args: Args) => Promise<Result>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Required query parameter, as the same NOT_FOUND sentinel the routes used to return. */
export function requireSearchParam(req: Request, name: string): string {
  const value = new URL(req.url).searchParams.get(name);
  if (!value) throw new Error("NOT_FOUND");
  return value;
}

export function apiError(
  status: number,
  code: string,
  message: string,
  opts?: { retryable?: boolean; fieldErrors?: Record<string, string>; retryAfter?: number },
) {
  const headers: Record<string, string> = { "Cache-Control": "private, no-store" };
  if (opts?.retryAfter) headers["Retry-After"] = String(opts.retryAfter);
  return NextResponse.json(
    {
      error: {
        code,
        message,
        retryable: opts?.retryable ?? false,
        fieldErrors: opts?.fieldErrors ?? {},
        requestId: randomUUID(),
      },
    },
    { status, headers },
  );
}

/** Map a thrown error to the stable HTTP contract. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of err.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return apiError(400, "INVALID_INPUT", "Some fields need attention.", { fieldErrors });
  }
  if (err instanceof CreditError) {
    return apiError(409, err.code, err.message);
  }
  const domain = domainErrorSpec(err);
  if (domain) {
    return apiError(domain.status, domain.code, domain.message, { retryAfter: domain.retryAfter });
  }
  const message = err instanceof Error ? err.message : String(err);
  const map: Array<[RegExp, number, string]> = [
    // Exact sentinel codes thrown by routes/services; must match the whole
    // message so loose patterns below can never swallow them.
    [/^NOT_CONFIGURED$/, 503, "NOT_CONFIGURED"],
    [/^UNSUPPORTED_ACTION$/, 400, "UNSUPPORTED_ACTION"],
    [/^IDEMPOTENCY_KEY_REQUIRED$/, 400, "IDEMPOTENCY_KEY_REQUIRED"],
    [/^INVALID_(TO|FROM)/, 400, "INVALID_ADDRESS"],
    [/^DRAFT_DELETED$/, 410, "DRAFT_DELETED"],
    [/NOT_FOUND/i, 404, "NOT_FOUND"],
    [/UNAUTHORIZED|SESSION_EXPIRED/i, 401, "UNAUTHENTICATED"],
    [/FORBIDDEN|ACCESS_DENIED/i, 403, "FORBIDDEN"],
    [/CONFLICT/i, 409, "CONFLICT"],
    [/VERSION_CONFLICT/i, 409, "VERSION_CONFLICT"],
    [/RATE_LIMITED/i, 429, "RATE_LIMITED"],
    [/UNAVAILABLE|TIMEOUT/i, 503, "DEPENDENCY_UNAVAILABLE"],
  ];
  for (const [pattern, status, code] of map) {
    if (pattern.test(message)) {
      return apiError(status, code, safeMessage(message));
    }
  }
  // Unknown failures must be observable (§29.1) — log with a safe shape.
  logger.error("api.unhandled_error", { message: message.slice(0, 300), path: "/api" });
  return apiError(500, "INTERNAL", "Something went wrong. Please try again.");
}

function safeMessage(message: string): string {
  // Never echo raw internal errors; use curated copy for known cases.
  const curated: Record<string, string> = {
    DRAFT_NOT_FOUND: "This draft no longer exists.",
    DRAFT_DELETED: "This draft was deleted.",
    CONTACT_NOT_FOUND: "This contact is no longer in the directory.",
    TEMPLATE_NOT_FOUND: "This template no longer exists.",
    GENERATION_NOT_FOUND: "This generation no longer exists.",
    DELIVERY_NOT_FOUND: "This delivery no longer exists.",
    ORDER_NOT_FOUND: "Order not found.",
    ACCOUNT_DELETED: "This account is closed.",
    UNSAFE_RETURN_PATH: "The return address is not allowed.",
    NOT_CONFIGURED: "This integration is not configured yet.",
    UNSUPPORTED_ACTION: "This action is not supported.",
    IDEMPOTENCY_KEY_REQUIRED: "An idempotency key is required for this request.",
  };
  return curated[message] ?? message.replace(/\s*\(.*?\)\s*$/, "");
}

/** Same-origin mutation policy for cookie-authenticated requests (§19.1). */
export async function assertSameOrigin(req: Request): Promise<void> {
  const origin = req.headers.get("origin");
  const secFetchSite = req.headers.get("sec-fetch-site");
  // Server Actions and fetch from same origin typically omit Origin for GET;
  // for mutations require same-origin evidence.
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    throw new Error("FORBIDDEN_ORIGIN");
  }
  if (origin) {
    const { allowedOrigins } = getConfig();
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      throw new Error("FORBIDDEN_ORIGIN");
    }
    // `allowedOrigins` already contains the canonical origins plus their hosts
    // and any EXTRA_ALLOWED_ORIGINS. A deployment that answers on more than
    // one custom domain must not lock users out of every form on the other.
    if (!allowedOrigins.includes(origin) && !allowedOrigins.includes(originHost)) {
      throw new Error("FORBIDDEN_ORIGIN");
    }
  }
}

export function requireIdempotencyKey(req: Request): string {
  const key = req.headers.get("idempotency-key");
  if (!key || key.length < 8 || key.length > 64 || !/^[A-Za-z0-9_-]+$/.test(key)) {
    throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  }
  return key;
}
