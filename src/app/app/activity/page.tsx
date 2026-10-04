import type { Metadata } from "next";
import { requireActiveUser } from "@/server/auth/session";
import { getLedger } from "@/server/services/credits";
import { listDeliveries } from "@/server/services/gmail";
import { Card, Badge } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Activity" };

const KIND_LABELS: Record<string, string> = {
  grant: "Credits granted",
  reserve: "AI generation reserved",
  consume: "AI generation used",
  release: "Generation failed — credit returned",
  reveal: "Contact email revealed",
  adjustment: "Support adjustment",
};

/** Activity chronology (§11.5): safe metadata only, no inbox events. */
export default async function ActivityPage() {
  const user = await requireActiveUser();
  const [ledger, deliveries] = await Promise.all([getLedger(user.id, "all", 60), listDeliveries(user.id, 20)]);

  type Event = { at: Date; kind: string; label: string; detail: string };
  const events: Event[] = [];

  for (const l of ledger) {
    events.push({
      at: new Date(l.created_at),
      kind: l.type,
      label: KIND_LABELS[l.kind] ?? l.kind,
      detail: `${l.available_delta >= 0 ? "+" : ""}${l.available_delta} contact/AI · ${l.reason ?? ""}`,
    });
  }
  for (const d of deliveries) {
    events.push({
      at: d.createdAt,
      kind: "gmail",
      label:
        d.state === "created"
          ? "Gmail draft created"
          : d.state === "known_failed"
            ? "Gmail draft failed"
            : d.state === "needs_confirmation"
              ? "Gmail draft needs confirmation"
              : `Gmail delivery ${d.state}`,
      detail: "Draft creation only — nothing was sent.",
    });
  }

  events.sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Activity</h2>
        <p className="text-sm text-text-secondary">
          Reveals, generations, deliveries, and purchases. Your inbox isn’t read, so sent/reply events never appear here.
        </p>
      </div>
      {events.length === 0 ? (
        <Card>
          <p className="text-sm text-text-secondary">No activity yet. It starts when you reveal a contact or generate a draft.</p>
        </Card>
      ) : (
        <ol className="space-y-2">
          {events.slice(0, 60).map((e, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border-decorative bg-surface px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">{e.label}</p>
                <p className="text-xs text-text-secondary">{e.detail}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={e.kind === "gmail" ? "info" : e.kind === "contact" ? "honey" : "neutral"}>{e.kind === "ai" ? "AI" : e.kind === "contact" ? "Contact" : e.kind === "gmail" ? "Gmail" : "Account"}</Badge>
                <span className="tabular text-xs text-text-disabled">{formatDateTime(e.at)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
