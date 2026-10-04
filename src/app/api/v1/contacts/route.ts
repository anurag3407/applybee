import { getApiUser } from "@/server/auth/session";
import { searchDirectory } from "@/server/services/contacts";
import { ok, errorResponse } from "@/server/http";
import { admitWithPreCheck, LIMITS } from "@/server/adapters/ratelimit";
import { QUERY_MAX } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));

    await admitWithPreCheck({
      policy: LIMITS.directorySearch,
      principal: user.id,
      operationRef: `dir:${user.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    });

    const url = new URL(req.url);
    const rows = await searchDirectory(user.id, {
      q: (url.searchParams.get("q") ?? "").slice(0, QUERY_MAX) || undefined,
      department: url.searchParams.get("dept") || undefined,
      roleCategory: url.searchParams.get("role") || undefined,
      location: url.searchParams.get("location")?.slice(0, QUERY_MAX) || undefined,
      stage: url.searchParams.get("stage") || undefined,
      verification: url.searchParams.get("verification") || undefined,
      cursor: url.searchParams.get("cursor") || undefined,
      pageSize: Number(url.searchParams.get("pageSize") ?? 25),
    });
    // Locked emails are absent by construction — maskedEmail uses only the domain.
    return ok(rows);
  } catch (err) {
    return errorResponse(err);
  }
}
