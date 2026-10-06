import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import { saveContact, unsaveContact, updateSavedContact } from "@/server/services/contacts";
import { ok, assertSameOrigin, route } from "@/server/http";

const putSchema = z.object({
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().max(40)).max(10).optional(),
});

export const PUT = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const { id } = await params;
  const body = putSchema.parse(await req.json().catch(() => ({})));
  await saveContact(user.id, id);
  if (Object.keys(body).length > 0) await updateSavedContact(user.id, id, body);
  return ok({ saved: true });
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return PUT(req, { params });
}

export const DELETE = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const { id } = await params;
  await unsaveContact(user.id, id);
  return ok({ saved: false });
});
