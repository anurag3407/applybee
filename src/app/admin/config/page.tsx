import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { requireAdmin } from "@/server/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, Badge } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";
import { getConfig } from "@/server/config";

export const metadata: Metadata = { title: "Admin · Config" };

export default async function AdminConfigPage() {
  await requireAdmin();
  const config = getConfig();
  const evidence = await db.execute(sql`
    SELECT co.name AS company, e.fact_type, e.source_name, e.checked_at, e.approval, e.confidence
    FROM company_evidence e JOIN companies co ON co.id = e.company_id
    ORDER BY e.checked_at DESC NULLS LAST LIMIT 20
  `);

  const flags: Array<[string, boolean | string, string]> = [
    ["FEATURE_AI_ENABLED", config.FEATURE_AI_ENABLED, "Kill switch for new AI reservations"],
    ["FEATURE_GMAIL_ENABLED", config.FEATURE_GMAIL_ENABLED, "Kill switch for new Gmail deliveries"],
    ["FEATURE_LIVE_PURCHASES_ENABLED", config.FEATURE_LIVE_PURCHASES_ENABLED, "Launch gate: economics/legal approval required"],
    ["FEATURE_RESUME_ATTACHMENTS_ENABLED", config.FEATURE_RESUME_ATTACHMENTS_ENABLED, "Requires scanner readiness"],
    ["AI adapter", config.aiMode, "openrouter/gemini requires corresponding API key"],
    ["Gmail adapter", config.gmailMode, "live requires Google OAuth credentials"],
    ["Payments adapter", config.paymentsMode, "razorpay requires live/test keys"],
    ["PAYMENTS_MODE", config.PAYMENTS_MODE, "test/live mismatch with deployment blocks activation"],
  ];

  return (
    <AdminShell title="Configuration (read-only view)">
      <Card>
        <h3 className="font-bold text-ink">Feature flags & adapters</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {flags.map(([name, value, note]) => (
            <li key={name} className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-border-decorative bg-canvas px-3 py-2">
              <span className="font-semibold text-ink">{name}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">{note}</span>
                {typeof value === "boolean" ? (
                  <Badge tone={value ? "success" : "warning"}>{value ? "on" : "off"}</Badge>
                ) : (
                  <Badge tone="info">{value}</Badge>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-text-disabled">
          Flags change through reviewed deployment configuration, not arbitrary UI edits. No secrets are shown here.
        </p>
      </Card>
      <Card className="mt-5">
        <h3 className="font-bold text-ink">Company evidence freshness</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-text-secondary">
          {(evidence.rows as Array<{ company: string; fact_type: string; source_name: string | null; checked_at: string | null; approval: string; confidence: string }>).map((e, i) => (
            <li key={i} className="flex flex-wrap justify-between gap-2">
              <span>{e.company} · {e.fact_type} · {e.source_name ?? "—"}</span>
              <span className="flex items-center gap-2">
                <Badge tone={e.approval === "approved" ? "success" : "warning"}>{e.approval}</Badge>
                <span className="tabular text-xs text-text-disabled">checked {formatDate(e.checked_at)}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </AdminShell>
  );
}
