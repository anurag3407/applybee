import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireApiUser } from "@/server/auth/session";
import { db } from "@/db/client";
import { privacyRequests } from "@/db/schema";
import { getObjectStore } from "@/server/adapters/objectStore";
import { apiError, route } from "@/server/http";

/** GET /privacy/export?id=… — owner-only download of a ready export archive. */
export const GET = route(async (req: Request) => {
  const user = await requireApiUser();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return apiError(400, "MISSING_ID", "Choose an export to download.");

  const request = (
    await db
      .select()
      .from(privacyRequests)
      .where(and(eq(privacyRequests.id, id), eq(privacyRequests.userId, user.id), eq(privacyRequests.kind, "export")))
      .limit(1)
  )[0];
  if (!request) return apiError(404, "EXPORT_NOT_FOUND", "This export is not available.");
  if (request.state !== "ready" || !request.resultRef) {
    return apiError(409, "EXPORT_NOT_READY", "Your export is still being prepared. Try again in a moment.");
  }

  let bytes: Uint8Array;
  try {
    bytes = await getObjectStore("export").get(request.resultRef);
  } catch {
    return apiError(410, "EXPORT_EXPIRED", "This export has expired. Request a new one.");
  }

  // The archive is JSON; send it as text so the Web Response body type stays simple.
  return new NextResponse(Buffer.from(bytes).toString("utf8"), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="reachbee-export-${request.id.slice(0, 8)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
});
