import { getSessionUser } from "@/server/auth/session";
import { listNotifications, markNotificationRead, dismissNotification } from "@/server/services/opportunities";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    return ok({ notifications: await listNotifications(user.id) });
  } catch (err) {
    return errorResponse(err);
  }
}

/** PATCH /notifications/:id — read/dismiss only owned notification (§19.2). */
export async function PATCH(req: Request) {
  try {
    await assertSameOrigin(req);
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const url = new URL(req.url);
    const notificationId = url.searchParams.get("id");
    const action = url.searchParams.get("action");
    if (!notificationId) return errorResponse(new Error("NOT_FOUND"));
    if (action === "read") await markNotificationRead(user.id, notificationId);
    else if (action === "dismiss") await dismissNotification(user.id, notificationId);
    else return errorResponse(new Error("UNSUPPORTED_ACTION"));
    return ok({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: Request) {
  return PATCH(req);
}

export async function POST() {
  return NextResponse.json({ error: { code: "UNSUPPORTED", message: "Use PATCH." } }, { status: 405 });
}
