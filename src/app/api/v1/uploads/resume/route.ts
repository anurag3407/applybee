import { getSessionUser } from "@/server/auth/session";
import { createUploadIntent, finalizeUpload, UploadError } from "@/server/services/resumes";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";

/** POST /uploads/resume — create the upload intent with constraints (§19.2). */
export async function POST(req: Request) {
  try {
    await assertSameOrigin(req);
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const intent = await createUploadIntent(user.id);
    return ok(intent, 201);
  } catch (err) {
    if (err instanceof UploadError) {
      const { apiError } = await import("@/server/http");
      const status = err.code === "RATE_LIMITED" ? 429 : err.code === "QUOTA_EXCEEDED" ? 409 : err.code === "UPLOADS_DISABLED" ? 503 : 400;
      return apiError(status, err.code, err.message);
    }
    return errorResponse(err);
  }
}

/**
 * PUT /uploads/resume — upload bytes to the pending intent. The server
 * verifies actual bytes; client claims are not trusted (§14.2).
 */
export async function PUT(req: Request) {
  try {
    await assertSameOrigin(req);
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const intentId = req.headers.get("x-upload-intent-id");
    if (!intentId) {
      const { apiError } = await import("@/server/http");
      return apiError(400, "INTENT_REQUIRED", "Missing upload intent.");
    }
    const bytes = new Uint8Array(await req.arrayBuffer());
    const filename = req.headers.get("x-filename") ?? "resume.pdf";
    const result = await finalizeUpload({ userId: user.id, uploadIntentId: intentId, bytes, displayFilename: filename });
    return ok(result, 201);
  } catch (err) {
    if (err instanceof UploadError) {
      const { apiError } = await import("@/server/http");
      return apiError(400, err.code, err.message);
    }
    return errorResponse(err);
  }
}
