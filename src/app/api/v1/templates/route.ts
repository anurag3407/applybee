import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import { createTemplate, listTemplates, updateTemplate, deleteTemplate } from "@/server/services/drafts";
import { templateSchema } from "@/lib/validation";
import { ok, assertSameOrigin, requireSearchParam, route } from "@/server/http";

export const GET = route(async () => {
  const user = await requireApiUser();
  return ok({ templates: await listTemplates(user.id) });
});

export const POST = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const body = templateSchema.parse(await req.json());
  const result = await createTemplate(user.id, body);
  return ok(result, 201);
});

const patchSchema = templateSchema.partial().extend({ expectedVersion: z.number().int().min(1) });

export const PATCH = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const templateId = requireSearchParam(req, "id");
  const body = patchSchema.parse(await req.json());
  await updateTemplate(user.id, templateId, body, body.expectedVersion);
  return ok({ saved: true });
});

export const DELETE = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const templateId = requireSearchParam(req, "id");
  await deleteTemplate(user.id, templateId);
  return ok({ deleted: true });
});
