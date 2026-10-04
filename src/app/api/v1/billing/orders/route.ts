import { z } from "zod";
import { getSessionUser } from "@/server/auth/session";
import { createOrder, OrderError } from "@/server/services/billing";
import { ok, errorResponse, assertSameOrigin, requireIdempotencyKey } from "@/server/http";

const schema = z.object({ sku: z.string().min(2).max(64) });

/** POST /billing/orders — server SKU validation + idempotent provider order. */
export async function POST(req: Request) {
  try {
    await assertSameOrigin(req);
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const idempotencyKey = requireIdempotencyKey(req);
    const body = schema.parse(await req.json());
    const result = await createOrder({ userId: user.id, sku: body.sku, idempotencyKey });
    return ok(result, 201);
  } catch (err) {
    if (err instanceof OrderError) {
      const { apiError } = await import("@/server/http");
      const status = err.code === "RATE_LIMITED" ? 429 : err.code === "SALES_DISABLED" ? 403 : err.code === "CATALOG_UNAVAILABLE" ? 503 : err.code === "IDEMPOTENCY_CONFLICT" ? 409 : 400;
      return apiError(status, err.code, err.message);
    }
    return errorResponse(err);
  }
}
