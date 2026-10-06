import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import { reportContact, reportBounceAndRefund } from "@/server/services/contacts";
import { ok, assertSameOrigin, route } from "@/server/http";

const schema = z.object({
  reportType: z.enum(["stale", "incorrect", "removal", "abuse", "bounced"]),
  details: z.string().trim().max(2000).optional().default(""),
});

export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await assertSameOrigin(req);
  // requireApiUser (active accounts only), not the session-only guard:
  // reporting mutates shared directory state and issues credits, so
  // disabled/deleting accounts must not be able to.
  const user = await requireApiUser();
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
});
