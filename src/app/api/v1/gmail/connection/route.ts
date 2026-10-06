import { requireApiUser } from "@/server/auth/session";
import { startConnect, getConnection, disconnectGmail, connectSandbox } from "@/server/services/gmail";
import { getConfig } from "@/server/config";
import { ok, assertSameOrigin, apiError, route } from "@/server/http";
import { NextResponse } from "next/server";

/** GET /gmail/connection — safe identity/scope/health, never tokens (§19.2). */
export const GET = route(async () => {
  const user = await requireApiUser();
  const config = getConfig();
  const connection = await getConnection(user.id);
  return ok({
    configured: Boolean(config.GOOGLE_OAUTH_CLIENT_ID),
    enabled: config.FEATURE_GMAIL_ENABLED,
    mode: config.gmailMode,
    connection: connection
      ? {
          email: connection.googleEmail,
          scopes: connection.scopes,
          version: connection.version,
          connectedAt: connection.createdAt,
        }
      : null,
  });
});

/** POST /gmail/connect — CSRF-protected OAuth initiation; server-issued redirect. */
export const POST = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const config = getConfig();
  const body = (await req.json().catch(() => ({}))) as { returnPath?: string; sandbox?: boolean };
  if (body.sandbox === true && config.gmailMode === "mock" && !config.isProduction) {
    await connectSandbox(user.id);
    return ok({ sandbox: true });
  }
  const result = await startConnect({ userId: user.id, returnPath: body.returnPath ?? "/app/settings/integrations" });
  if ("error" in result) {
    return apiError(409, "CONNECT_UNAVAILABLE", result.error);
  }
  return ok({ authorizeUrl: result.authorizeUrl });
});

/** DELETE /gmail/connection — version bump, approvals invalidated, tokens removed. */
export const DELETE = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  await disconnectGmail(user.id);
  return NextResponse.json({ data: { disconnected: true }, meta: {} }, { headers: { "Cache-Control": "private, no-store" } });
});
