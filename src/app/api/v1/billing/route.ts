import { getApiUser } from "@/server/auth/session";
import { getBalances, getLedger } from "@/server/services/credits";
import { getPublishedCatalog } from "@/server/services/billing";
import { ok, errorResponse } from "@/server/http";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const view = url.searchParams.get("view") ?? "balances";
    if (view === "catalog") {
      const catalog = await getPublishedCatalog();
      return ok({ available: catalog !== null, catalog });
    }
    if (view === "ledger") {
      const user = await getApiUser();
      if (!user) return errorResponse(new Error("UNAUTHORIZED"));
      const type = (url.searchParams.get("type") ?? "all") as "contact" | "ai" | "all";
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const rows = await getLedger(user.id, type, 50, offset);
      return ok({ entries: rows });
    }
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    return ok({ balances: await getBalances(user.id) });
  } catch (err) {
    return errorResponse(err);
  }
}
