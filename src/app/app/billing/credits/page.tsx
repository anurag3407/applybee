import type { Metadata } from "next";
import { requireActiveUser } from "@/server/auth/session";
import { getLedger } from "@/server/services/credits";
import { Card } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Credit ledger" };

const KIND_LABELS: Record<string, string> = {
  grant: "Granted",
  reserve: "Reserved for AI generation",
  consume: "Consumed by AI generation",
  release: "Released (generation failed/cancelled)",
  reveal: "Contact reveal",
  adjustment: "Support adjustment",
  refund_hold: "Refund hold",
  refund_reverse: "Refund reversal",
  refund_release: "Refund hold released",
};

export default async function CreditsLedgerPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const user = await requireActiveUser();
  const { type } = await searchParams;
  const ledgerType = type === "contact" || type === "ai" ? type : "all";
  const rows = await getLedger(user.id, ledgerType, 100);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Credit ledger</h2>
        <p className="text-sm text-text-secondary">
          Append-only history. Balances are the sum of these entries — no opaque deductions.
        </p>
      </div>

      <nav aria-label="Ledger filter" className="flex gap-2 text-sm">
        {[
          { key: "all", label: "All" },
          { key: "contact", label: "Contact reveals" },
          { key: "ai", label: "AI generations" },
        ].map((f) => (
          <a
            key={f.key}
            href={f.key === "all" ? "/app/billing/credits" : `/app/billing/credits?type=${f.key}`}
            className={`rounded-pill px-3 py-1.5 font-semibold ${ledgerType === f.key ? "bg-ink text-surface" : "bg-surface-subtle text-ink"}`}
          >
            {f.label}
          </a>
        ))}
      </nav>

      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Credit ledger entries</caption>
          <thead>
            <tr className="border-b border-border-decorative text-xs uppercase tracking-wide text-text-secondary">
              <th scope="col" className="px-4 py-3 font-semibold">Event</th>
              <th scope="col" className="px-4 py-3 font-semibold">Available Δ</th>
              <th scope="col" className="px-4 py-3 font-semibold">Reserved Δ</th>
              <th scope="col" className="px-4 py-3 font-semibold">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-decorative/70">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">{KIND_LABELS[r.kind] ?? r.kind}</p>
                  <p className="text-xs text-text-secondary">{r.type === "contact" ? "Contact" : "AI"} · {r.reason}</p>
                </td>
                <td className={`tabular px-4 py-3 font-semibold ${r.available_delta > 0 ? "text-success" : r.available_delta < 0 ? "text-danger" : "text-text-disabled"}`}>
                  {r.available_delta > 0 ? "+" : ""}
                  {r.available_delta}
                </td>
                <td className={`tabular px-4 py-3 ${r.reserved_delta === 0 ? "text-text-disabled" : "text-ink"}`}>
                  {r.reserved_delta > 0 ? "+" : ""}
                  {r.reserved_delta}
                </td>
                <td className="tabular px-4 py-3 text-text-secondary">{formatDateTime(r.created_at)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-text-secondary">
                  No entries yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-text-disabled">
        Reservations appear as “in use” until a generation settles: validated drafts consume the reservation; failures
        release it back automatically.
      </p>
    </div>
  );
}
