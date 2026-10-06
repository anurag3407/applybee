import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import { acceptProposal, dismissProposal } from "@/server/services/drafts";
import { ok, assertSameOrigin, route } from "@/server/http";

const schema = z.object({
  expectedVersion: z.number().int().min(0),
  action: z.enum(["accept", "dismiss"]).default("accept"),
});

/**
 * Apply the saved proposed result with expected draft version — no second AI
 * credit; conflicts preserve manual edits (§19.2). Credit shortfalls are
 * `CreditError`, which `errorResponse` already maps to 409 with the same code
 * and message this handler used to build by hand.
 */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const { id } = await params;
  const body = schema.parse(await req.json());

  if (body.action === "dismiss") {
    await dismissProposal(user.id, id);
    return ok({ dismissed: true });
  }
  const result = await acceptProposal({ userId: user.id, generationId: id, expectedVersion: body.expectedVersion });
  return ok(result);
});
