import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import { revealContactForUser } from "@/server/services/contacts";
import { getBalances } from "@/server/services/credits";
import { ok, assertSameOrigin, requireIdempotencyKey, route } from "@/server/http";

const bodySchema = z.object({}).passthrough();

/**
 * Idempotent atomic reveal (§18.3). Response carries the authoritative
 * balance; the UI never computes credits locally.
 */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  bodySchema.parse(await req.json().catch(() => ({})));
  const idempotencyKey = requireIdempotencyKey(req);
  const { id } = await params;

  const result = await revealContactForUser({ userId: user.id, contactId: id, idempotencyKey });
  const balances = await getBalances(user.id);
  return ok({ ...result, balances });
});
