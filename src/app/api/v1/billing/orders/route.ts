import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import { createOrder } from "@/server/services/billing";
import { ok, assertSameOrigin, requireIdempotencyKey, route } from "@/server/http";

const schema = z.object({ sku: z.string().min(2).max(64) });

/** POST /billing/orders — server SKU validation + idempotent provider order. */
export const POST = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const idempotencyKey = requireIdempotencyKey(req);
  const body = schema.parse(await req.json());
  const result = await createOrder({ userId: user.id, sku: body.sku, idempotencyKey });
  return ok(result, 201);
});
