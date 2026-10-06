import { requireApiUser } from "@/server/auth/session";
import { createUploadIntent, finalizeUpload, MAX_RESUME_BYTES } from "@/server/services/resumes";
import { ok, apiError, assertSameOrigin, route } from "@/server/http";

/**
 * Read at most MAX_RESUME_BYTES from the request stream and abort as soon as
 * the limit is passed. Buffering with `await req.arrayBuffer()` first would
 * materialize the entire body in memory before any size check, so any signed-in
 * user could send a multi-gigabyte upload and exhaust the Worker's heap.
 */
async function readCappedBody(req: Request, maxBytes: number): Promise<Uint8Array | null> {
  const body = req.body;
  if (!body) return null;
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } catch {
    await reader.cancel().catch(() => {});
    throw new Error("UPLOAD_STREAM_FAILED");
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/** POST /uploads/resume — create the upload intent with constraints (§19.2). */
export const POST = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const intent = await createUploadIntent(user.id);
  return ok(intent, 201);
});

/**
 * PUT /uploads/resume — upload bytes to the pending intent. The server
 * verifies actual bytes; client claims are not trusted (§14.2).
 */
export const PUT = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const intentId = req.headers.get("x-upload-intent-id");
  if (!intentId) {
    return apiError(400, "INTENT_REQUIRED", "Missing upload intent.");
  }

  // Reject on the declared length first so an oversized body is never read.
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_RESUME_BYTES) {
    return apiError(413, "FILE_TOO_LARGE", "The file is larger than 5 MiB. Upload a smaller PDF or add your experience manually.");
  }

  const bytes = await readCappedBody(req, MAX_RESUME_BYTES);
  if (!bytes) {
    return apiError(413, "FILE_TOO_LARGE", "The file is larger than 5 MiB. Upload a smaller PDF or add your experience manually.");
  }

  const filename = req.headers.get("x-filename") ?? "resume.pdf";
  const result = await finalizeUpload({ userId: user.id, uploadIntentId: intentId, bytes, displayFilename: filename });
  return ok(result, 201);
});
