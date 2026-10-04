import { getSessionUser } from "@/server/auth/session";
import { listResumes, deleteResume } from "@/server/services/resumes";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    return ok({ resumes: await listResumes(user.id) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: Request) {
  try {
    await assertSameOrigin(req);
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const url = new URL(req.url);
    const resumeId = url.searchParams.get("id");
    if (!resumeId) return errorResponse(new Error("NOT_FOUND"));
    await deleteResume(user.id, resumeId);
    return ok({ deleted: true });
  } catch (err) {
    return errorResponse(err);
  }
}
