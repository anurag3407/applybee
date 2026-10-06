import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import { createDraft, listDrafts } from "@/server/services/drafts";
import { ok, assertSameOrigin, route } from "@/server/http";

const createSchema = z.object({
  mode: z.enum(["manual", "quick_ai", "agentic"]).default("manual"),
  intent: z.enum(["advertised_role", "internship", "intro", "referral", "follow_up"]).default("intro"),
  recipient: z
    .union([
      z.object({ kind: z.literal("directory"), contactId: z.string().uuid() }),
      z.object({ kind: z.literal("own"), email: z.string().email(), name: z.string().max(120).optional() }),
    ])
    .optional(),
  subject: z.string().max(160).optional(),
  body: z.string().max(20_000).optional(),
});

export const GET = route(async () => {
  const user = await requireApiUser();
  const rows = await listDrafts(user.id);
  return ok({ drafts: rows });
});

export const POST = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const body = createSchema.parse(await req.json());
  const id = await createDraft({
    userId: user.id,
    mode: body.mode,
    intent: body.intent,
    recipient: body.recipient,
    subject: body.subject,
    body: body.body,
  });
  return ok({ draftId: id }, 201);
});
