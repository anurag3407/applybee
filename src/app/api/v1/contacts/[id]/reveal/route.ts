import { z } from "zod";
import { getApiUser } from "@/server/auth/session";
import { revealContactForUser, RevealError } from "@/server/services/contacts";
import { getBalances } from "@/server/services/credits";
import { ok, errorResponse, assertSameOrigin, requireIdempotencyKey } from "@/server/http";

const bodySchema = z.object({}).passthrough();

/**
 * Idempotent atomic reveal (§18.3). Response carries the authoritative
 * balance; the UI never computes credits locally.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(req);
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    bodySchema.parse(await req.json().catch(() => ({})));
    const idempotencyKey = requireIdempotencyKey(req);
    const { id } = await params;

    const result = await revealContactForUser({ userId: user.id, contactId: id, idempotencyKey });
    const balances = await getBalances(user.id);
    return ok({ ...result, balances });
  } catch (err) {
    if (err instanceof RevealError) {
      if (err.code === "RATE_LIMITED") return errorResponse(new Error("RATE_LIMITED"));
      if (err.code === "IDEMPOTENCY_CONFLICT") return errorResponse(new Error("CONFLICT"));
      return errorResponse(err);
    }
    if (err instanceof Error && err.message === "IDEMPOTENCY_KEY_REQUIRED") {
      return errorResponse(new Error("IDEMPOTENCY_KEY_REQUIRED"));
    }
    return errorResponse(err);
  }
}
