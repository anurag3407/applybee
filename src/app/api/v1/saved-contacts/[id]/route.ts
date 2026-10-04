import { z } from "zod";
import { getApiUser } from "@/server/auth/session";
import { saveContact, unsaveContact, updateSavedContact } from "@/server/services/contacts";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";

const putSchema = z.object({
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().max(40)).max(10).optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(req);
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const { id } = await params;
    const body = putSchema.parse(await req.json().catch(() => ({})));
    await saveContact(user.id, id);
    if (Object.keys(body).length > 0) await updateSavedContact(user.id, id, body);
    return ok({ saved: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return PUT(req, { params });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(req);
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const { id } = await params;
    await unsaveContact(user.id, id);
    return ok({ saved: false });
  } catch (err) {
    return errorResponse(err);
  }
}
