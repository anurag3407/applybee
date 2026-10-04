import { handleConnectCallback } from "@/server/services/gmail";
import { NextResponse } from "next/server";
import { getConfig } from "@/server/config";

/**
 * GET /gmail/callback — one-time state/code handling; redirect cleanly to the
 * result route with no OAuth parameters exposed (§16.2, §19.2).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const result = await handleConnectCallback({ code, state, errorResponse: errorParam });
  const config = getConfig();
  const base = config.APP_BASE_URL;

  const params = new URLSearchParams({ result: result.status });
  if (result.status === "connected") params.set("mailbox", result.email);
  if (result.status === "error") params.set("reason", result.reason);
  return NextResponse.redirect(`${base}/app/settings/integrations/gmail/result?${params.toString()}`, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
