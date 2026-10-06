import { requireApiUser } from "@/server/auth/session";
import { searchDirectory } from "@/server/services/contacts";
import { ok, route } from "@/server/http";
import { QUERY_MAX } from "@/lib/validation";

export const GET = route(async (req: Request) => {
  const user = await requireApiUser();
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
});
