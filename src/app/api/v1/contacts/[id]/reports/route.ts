import { z } from "zod";
import { getApiUser } from "@/server/auth/session";
import { reportContact, reportBounceAndRefund, RevealError } from "@/server/services/contacts";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";

const schema = z.object({
  reportType: z.enum(["stale", "incorrect", "removal", "abuse", "bounced"]),
  details: z.string().trim().max(2000).optional().default(""),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(req);
    // getApiUser, not getSessionUser: reporting mutates shared directory state
    // and issues credits, so disabled/deleting accounts must not be able to.
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const { id } = await params;
    const body = schema.parse(await req.json());

    if (body.reportType === "bounced") {
      const result = await reportBounceAndRefund({ userId: user.id, contactId: id });
      return ok(result);
    }

    await reportContact({
      userId: user.id,
      contactId: id,
      reportType: body.reportType,
      details: body.details || "User reported contact",
    });
    return ok({ reported: true });
  } catch (err) {
    if (err instanceof RevealError && err.code === "RATE_LIMITED") {
      return errorResponse(new Error("RATE_LIMITED"));
    }
    return errorResponse(err);
  }
}
