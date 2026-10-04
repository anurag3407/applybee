import { z } from "zod";
import { getApiUser } from "@/server/auth/session";
import { acceptProposal, dismissProposal } from "@/server/services/drafts";
import { CreditError } from "@/server/services/credits";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";

const schema = z.object({
  expectedVersion: z.number().int().min(0),
  action: z.enum(["accept", "dismiss"]).default("accept"),
});

/**
 * Apply the saved proposed result with expected draft version — no second AI
 * credit; conflicts preserve manual edits (§19.2).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(req);
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const { id } = await params;
    const body = schema.parse(await req.json());

    if (body.action === "dismiss") {
      await dismissProposal(user.id, id);
      return ok({ dismissed: true });
    }
    const result = await acceptProposal({ userId: user.id, generationId: id, expectedVersion: body.expectedVersion });
    return ok(result);
  } catch (err) {
    if (err instanceof CreditError) {
      const { apiError } = await import("@/server/http");
      return apiError(409, err.code, err.message);
    }
    return errorResponse(err);
  }
}
