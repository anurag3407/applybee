import { NextResponse } from "next/server";
import { devSignIn, getSessionUser } from "@/server/auth/session";
import { getConfig } from "@/server/config";
import { safeEmail } from "@/lib/validation";
import { apiError } from "@/server/http";
import { z } from "zod";

/**
 * Local development session adapter sign-in (labeled in the UI). Never
 * available when Clerk is configured or in production (config-validated).
 */
export async function POST(req: Request) {
  const config = getConfig();
  if (config.authMode !== "dev" || config.isProduction) {
    return apiError(403, "FORBIDDEN", "Developer sign-in is only available in local development.");
  }
  const body = (await req.json().catch(() => null)) as { email?: string; name?: string } | null;
  const parsed = z.object({ email: safeEmail, name: z.string().max(120).optional() }).safeParse(body);
  if (!parsed.success) {
    return apiError(400, "INVALID_INPUT", "Enter a valid email address.");
  }
  const result = await devSignIn({ email: parsed.data.email, displayName: parsed.data.name });
  return NextResponse.json(
    { data: { userId: result.userId, mode: "email" }, meta: {} },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ data: { signedIn: Boolean(user) }, meta: {} });
}
