import { NextResponse } from "next/server";
import { signOut } from "@/server/auth/session";
import { assertSameOrigin, route } from "@/server/http";

export const POST = route(async (req: Request) => {
  // Session termination is a cookie-authenticated mutation; reject
  // cross-site POSTs instead of allowing forced sign-out.
  await assertSameOrigin(req);
  await signOut();
  return NextResponse.json({ data: { ok: true }, meta: {} }, { headers: { "Cache-Control": "private, no-store" } });
});
