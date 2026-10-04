import { z } from "zod";
import { getApiUser } from "@/server/auth/session";
import { createTemplate, listTemplates, updateTemplate, deleteTemplate, DraftConflictError } from "@/server/services/drafts";
import { templateSchema } from "@/lib/validation";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    return ok({ templates: await listTemplates(user.id) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await assertSameOrigin(req);
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const body = templateSchema.parse(await req.json());
    const result = await createTemplate(user.id, body);
    return ok(result, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

const patchSchema = templateSchema.partial().extend({ expectedVersion: z.number().int().min(1) });

export async function PATCH(req: Request) {
  try {
    await assertSameOrigin(req);
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const url = new URL(req.url);
    const templateId = url.searchParams.get("id");
    if (!templateId) return errorResponse(new Error("NOT_FOUND"));
    const body = patchSchema.parse(await req.json());
    await updateTemplate(user.id, templateId, body, body.expectedVersion);
    return ok({ saved: true });
  } catch (err) {
    if (err instanceof DraftConflictError) return errorResponse(new Error("VERSION_CONFLICT"));
    return errorResponse(err);
  }
}

export async function DELETE(req: Request) {
  try {
    await assertSameOrigin(req);
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const url = new URL(req.url);
    const templateId = url.searchParams.get("id");
    if (!templateId) return errorResponse(new Error("NOT_FOUND"));
    await deleteTemplate(user.id, templateId);
    return ok({ deleted: true });
  } catch (err) {
    return errorResponse(err);
  }
}
