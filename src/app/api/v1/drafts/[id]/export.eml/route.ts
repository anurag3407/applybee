import { getSessionUser } from "@/server/auth/session";
import { exportEml } from "@/server/services/drafts";
import { errorResponse } from "@/server/http";
import { NextResponse } from "next/server";

/** GET /drafts/:id/export.eml — authorized download; no hidden links (§19.2). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const { id } = await params;
    const result = await exportEml(user.id, id);
    if (!result) return errorResponse(new Error("DRAFT_NOT_FOUND"));
    return new NextResponse(result.content, {
      status: 200,
      headers: {
        "Content-Type": "message/rfc822",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
