import { NextResponse } from "next/server";
import { signOut } from "@/server/auth/session";

export async function POST() {
  await signOut();
  return NextResponse.json({ data: { ok: true }, meta: {} }, { headers: { "Cache-Control": "private, no-store" } });
}
