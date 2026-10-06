import { requireApiUser } from "@/server/auth/session";
import { getResume } from "@/server/services/resumes";
import { getObjectStore } from "@/server/adapters/objectStore";
import { apiError, route } from "@/server/http";
import { sanitizeFilename } from "@/server/adapters/mime";

/**
 * GET /api/v1/resumes/:id/download — owner-authorized resume download.
 *
 * Authorization is the session cookie plus an ownership check on the resume
 * row; the bytes are never served from a public or guessable URL and the
 * response is explicitly private/no-store. A file must have passed the scan
 * gate before it can leave the server, so an unscanned upload is never
 * downloadable.
 */
export const GET = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser();

  const { id } = await params;
  const resume = await getResume(user.id, id);
  if (!resume) return apiError(404, "NOT_FOUND", "This resume no longer exists.");
  if (resume.state === "deleted" || resume.state === "deleting") {
    return apiError(404, "NOT_FOUND", "This resume no longer exists.");
  }
  if (resume.scanStatus !== "clean") {
    return apiError(
      409,
      "ATTACHMENT_NOT_READY",
      resume.scanStatus === "rejected"
        ? "This file failed the safety check and cannot be downloaded."
        : "This file is still being checked. You can download it once it passes.",
    );
  }

  const store = getObjectStore(resume.objectKey.startsWith("clean/") ? "clean" : "quarantine");
  let bytes: Uint8Array;
  try {
    bytes = await store.get(resume.objectKey);
  } catch {
    return apiError(410, "FILE_GONE", "The stored file is no longer available. Upload it again.");
  }

  return new Response(bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `attachment; filename="${sanitizeFilename(resume.displayFilename)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});