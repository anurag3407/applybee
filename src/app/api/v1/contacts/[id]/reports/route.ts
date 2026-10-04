import { z } from "zod";
import { getSessionUser } from "@/server/auth/session";
import { reportContact } from "@/server/services/contacts";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";

const schema = z.object({
  reportType: z.enum(["stale", "incorrect", "removal", "abuse"]),
  details: z.string().trim().min(10).max(2000),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(req);
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const { id } = await params;
    const body = schema.parse(await req.json());
    await reportContact({ userId: user.id, contactId: id, reportType: body.reportType, details: body.details });
    return ok({ reported: true });
  } catch (err) {
    return errorResponse(err);
  }
}
