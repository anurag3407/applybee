import { requireApiUser } from "@/server/auth/session";
import { exportEml } from "@/server/services/drafts";
import { errorResponse, route } from "@/server/http";
import { NextResponse } from "next/server";

/** GET /drafts/:id/export.eml — authorized download; no hidden links (§19.2). */
export const GET = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser();
  const { id } = await params;
  const result = await exportEml(user.id, id);
  if (!result) return errorResponse(new Error("DRAFT_NOT_FOUND"));
  // exportEml resolves drafts regardless of status; a deleted draft's .eml
  // must not stay downloadable (same rule as the GET editor endpoint).
  if (result.status === "deleting" || result.status === "deleted") {
    return errorResponse(new Error("DRAFT_DELETED"));
  }
  return new NextResponse(result.content, {
    status: 200,
    headers: {
      "Content-Type": "message/rfc822",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
