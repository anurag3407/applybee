import { requireApiUser } from "@/server/auth/session";
import { listResumes, deleteResume } from "@/server/services/resumes";
import { ok, assertSameOrigin, requireSearchParam, route } from "@/server/http";

export const GET = route(async () => {
  const user = await requireApiUser();
  return ok({ resumes: await listResumes(user.id) });
});

export const DELETE = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const resumeId = requireSearchParam(req, "id");
  await deleteResume(user.id, resumeId);
  return ok({ deleted: true });
});
