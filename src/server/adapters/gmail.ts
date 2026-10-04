import "server-only";
import { getConfig } from "@/server/config";
import { logger } from "@/server/logger";
import { decryptEnvelope, encryptEnvelope, randomToken } from "@/server/crypto";
import { buildMimeMessage, type MimeInput } from "./mime";

/**
 * Gmail draft gateway (§16). The adapter exposes ONLY draft creation and
 * bounded reconciliation — there is no send capability anywhere in this
 * interface, and the HTTP allowlist below rejects send paths even if code
 * were later introduced mistakenly (§16.6).
 */

export type GmailCreateOutcome =
  | { kind: "created"; providerDraftId: string; providerMessageId: string | null }
  | { kind: "known_failed"; code: string; message: string; retryable: boolean }
  | { kind: "unknown"; message: string };

export type ReconciliationOutcome =
  | { kind: "found"; providerDraftId: string }
  | { kind: "not_found_conclusive" }
  | { kind: "inconclusive"; message: string };

export interface GmailDraftGateway {
  createApprovedDraft(input: MimeInput & { accessToken: string }): Promise<GmailCreateOutcome>;
  listRecentDraftMarkers(input: { accessToken: string; marker: string; max: number }): Promise<ReconciliationOutcome>;
}

const GMAIL_HOST = "gmail.googleapis.com";

async function gmailFetch(
  accessToken: string,
  path: string,
  init: { method: string; body?: string; headers?: Record<string, string>; timeoutMs?: number },
): Promise<{ status: number; body: string; networkError: boolean }> {
  // Hard allowlist: only draft-list and draft-create endpoints may be called.
  // Any send path is rejected in code, not just by policy (§16.6).
  const allowed = /^\/(upload\/)?gmail\/v1\/users\/me\/drafts(\/.*)?$/;
  if (!allowed.test(path) || /\/send\b|\/send\/|messages\/send/.test(path)) {
    throw new Error("FORBIDDEN_GMAIL_PATH: only draft operations are permitted");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init.timeoutMs ?? 30_000);
  try {
    const res = await fetch(`https://${GMAIL_HOST}${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init.headers ?? {}),
      },
      body: init.body,
      signal: controller.signal,
    });
    const body = await res.text();
    return { status: res.status, body, networkError: false };
  } catch (err) {
    logger.warn("gmail.network_error", { path, error: String(err) });
    return { status: 0, body: "", networkError: true };
  } finally {
    clearTimeout(timer);
  }
}

class LiveGmailGateway implements GmailDraftGateway {
  async createApprovedDraft(input: MimeInput & { accessToken: string }): Promise<GmailCreateOutcome> {
    const mime = buildMimeMessage(input);
    const res = await gmailFetch(input.accessToken, "/gmail/v1/users/me/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: { raw: mime.rawBase64Url } }),
      timeoutMs: 30_000,
    });
    if (res.networkError) {
      return { kind: "unknown", message: "The request to Gmail did not complete in time." };
    }
    if (res.status >= 200 && res.status < 300) {
      try {
        const parsed = JSON.parse(res.body) as { id: string; message?: { id?: string } };
        return { kind: "created", providerDraftId: parsed.id, providerMessageId: parsed.message?.id ?? null };
      } catch {
        return { kind: "unknown", message: "Gmail responded but the result could not be read." };
      }
    }
    if (res.status === 401) {
      return { kind: "known_failed", code: "TOKEN_EXPIRED", message: "Gmail authorization expired.", retryable: true };
    }
    if (res.status === 403) {
      return { kind: "known_failed", code: "PERMISSION_DENIED", message: "Gmail denied draft creation. Reconnect may be required.", retryable: false };
    }
    if (res.status === 429) {
      return { kind: "known_failed", code: "GMAIL_QUOTA", message: "Gmail rate limit reached. Try again shortly.", retryable: true };
    }
    if (res.status >= 500) {
      return { kind: "unknown", message: "Gmail returned a temporary server error." };
    }
    return { kind: "known_failed", code: `GMAIL_${res.status}`, message: "Gmail rejected this draft.", retryable: false };
  }

  async listRecentDraftMarkers(input: { accessToken: string; marker: string; max: number }): Promise<ReconciliationOutcome> {
    // Bounded metadata listing of drafts only (§16.5). Absence is NOT
    // conclusive proof of failure.
    const res = await gmailFetch(input.accessToken, `/gmail/v1/users/me/drafts?maxResults=${Math.min(input.max, 20)}&q=${encodeURIComponent(`in:draft X-ApplyBee-Operation:${input.marker}`)}`, {
      method: "GET",
      timeoutMs: 20_000,
    });
    if (res.networkError || res.status >= 500) {
      return { kind: "inconclusive", message: "Gmail is temporarily unreachable." };
    }
    if (res.status >= 200 && res.status < 300) {
      try {
        const parsed = JSON.parse(res.body) as { drafts?: Array<{ id: string }> };
        if (parsed.drafts && parsed.drafts.length > 0) {
          return { kind: "found", providerDraftId: parsed.drafts[0]!.id };
        }
        return { kind: "inconclusive", message: "The draft list could not confirm the outcome." };
      } catch {
        return { kind: "inconclusive", message: "Unexpected Gmail response format." };
      }
    }
    return { kind: "inconclusive", message: "Reconciliation is temporarily unavailable." };
  }
}

/**
 * Mock gateway for development and tests. Conspicuously labeled; never
 * activates when live credentials exist. It simulates uncertainty modes via
 * the operation marker so the reconciliation UI can be exercised honestly.
 */
class MockGmailGateway implements GmailDraftGateway {
  async createApprovedDraft(input: MimeInput & { accessToken: string }): Promise<GmailCreateOutcome> {
    if (input.operationMarker.includes("SIM-UNKNOWN")) {
      return { kind: "unknown", message: "[Mock Gmail] Simulated lost response for demonstration." };
    }
    if (input.operationMarker.includes("SIM-FAIL")) {
      return { kind: "known_failed", code: "PERMISSION_DENIED", message: "[Mock Gmail] Simulated rejection.", retryable: false };
    }
    return { kind: "created", providerDraftId: `mock-draft-${randomToken(8)}`, providerMessageId: `mock-msg-${randomToken(8)}` };
  }

  async listRecentDraftMarkers(input: { accessToken: string; marker: string }): Promise<ReconciliationOutcome> {
    if (input.marker.includes("SIM-UNKNOWN")) {
      return { kind: "inconclusive", message: "[Mock Gmail] Outcome remains unconfirmed in this simulation." };
    }
    return { kind: "not_found_conclusive" };
  }
}

export function getGmailGateway(): GmailDraftGateway {
  const config = getConfig();
  return config.gmailMode === "live" ? new LiveGmailGateway() : new MockGmailGateway();
}

/* ------------------------------------------------------------------ */
/* OAuth + token management                                            */
/* ------------------------------------------------------------------ */

export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.compose";
export const GMAIL_OAUTH_SCOPES = ["openid", "email", GMAIL_SCOPE];

export function buildOAuthState(): { state: string; verifier: string } {
  return { state: randomToken(24), verifier: randomToken(48) };
}

export function buildAuthorizeUrl(params: { clientId: string; redirectUri: string; state: string; challenge: string }): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GMAIL_OAUTH_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "false");
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export type TokenExchangeResult =
  | { kind: "ok"; accessToken: string; expiresIn: number; refreshToken: string | null; scope: string; idTokenEmail: string | null }
  | { kind: "invalid_grant" }
  | { kind: "error"; code: string };

export async function exchangeAuthorizationCode(params: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
  verifier: string;
}): Promise<TokenExchangeResult> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: params.clientId,
        client_secret: params.clientSecret,
        code: params.code,
        code_verifier: params.verifier,
        grant_type: "authorization_code",
        redirect_uri: params.redirectUri,
      }),
    });
    const body = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
      scope?: string;
      id_token?: string;
      error?: string;
    };
    if (body.error === "invalid_grant") return { kind: "invalid_grant" };
    if (!res.ok || !body.access_token) return { kind: "error", code: body.error ?? `HTTP_${res.status}` };
    let email: string | null = null;
    if (body.id_token) {
      try {
        const payload = JSON.parse(Buffer.from(body.id_token.split(".")[1]!, "base64url").toString("utf8")) as { email?: string };
        email = payload.email ?? null;
      } catch {
        email = null;
      }
    }
    return {
      kind: "ok",
      accessToken: body.access_token,
      expiresIn: body.expires_in ?? 3600,
      refreshToken: body.refresh_token ?? null,
      scope: body.scope ?? "",
      idTokenEmail: email,
    };
  } catch (err) {
    logger.error("gmail.token_exchange_failed", { error: String(err) });
    return { kind: "error", code: "NETWORK" };
  }
}

export async function refreshAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<TokenExchangeResult> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: params.clientId,
        client_secret: params.clientSecret,
        refresh_token: params.refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const body = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
    if (body.error === "invalid_grant") return { kind: "invalid_grant" };
    if (!res.ok || !body.access_token) return { kind: "error", code: body.error ?? `HTTP_${res.status}` };
    return { kind: "ok", accessToken: body.access_token, expiresIn: body.expires_in ?? 3600, refreshToken: null, scope: "", idTokenEmail: null };
  } catch {
    return { kind: "error", code: "NETWORK" };
  }
}

export function encryptTokenEnvelope(tokens: { refreshToken?: string | null; accessToken?: string | null }, binding: string): string {
  return encryptEnvelope(JSON.stringify(tokens), binding);
}

export function decryptTokenEnvelope<T extends { refreshToken?: string | null; accessToken?: string | null }>(envelope: string, binding: string): T {
  return JSON.parse(decryptEnvelope(envelope, binding)) as T;
}

export async function revokeGrant(accessTokenOrRefreshToken: string, isRefresh = true): Promise<boolean> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(isRefresh ? { token: accessTokenOrRefreshToken } : { token: accessTokenOrRefreshToken }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
