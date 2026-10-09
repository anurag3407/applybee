import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveUser } from "@/server/auth/session";
import { getBalances } from "@/server/services/credits";
import { getPublishedCatalog } from "@/server/services/billing";
import { Card, Badge, Button } from "@/components/ui/primitives";
import { formatINRPaise } from "@/lib/format";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const user = await requireActiveUser();
  const [balances, catalog] = await Promise.all([getBalances(user.id), getPublishedCatalog()]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Billing</h2>
        <p className="text-sm text-text-secondary">Balances, reservations, and purchases, one place.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="text-xs font-bold text-text-disabled">Contact reveals</h3>
          <p className="mt-1 text-3xl font-bold tabular text-ink">{balances.contact.available}</p>
          <p className="text-xs text-text-secondary">
            {balances.contact.reserved > 0 ? `${balances.contact.reserved} reserved` : "No reservations"}
          </p>
        </Card>
        <Card>
          <h3 className="text-xs font-bold text-text-disabled">AI generations</h3>
          <p className="mt-1 text-3xl font-bold tabular text-ink">{balances.ai.available}</p>
          <p className="text-xs text-text-secondary">
            {balances.ai.reserved > 0 ? `${balances.ai.reserved} reserved (in progress)` : "No reservations"}
          </p>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/app/billing/plans" className="rounded-card border border-border-decorative bg-surface p-4 shadow-card hover:bg-surface-subtle/60">
          <p className="font-bold text-ink">Plans & packs</p>
          <p className="text-sm text-text-secondary">One-time purchases, shown with exact quantities.</p>
        </Link>
        <Link href="/app/billing/credits" className="rounded-card border border-border-decorative bg-surface p-4 shadow-card hover:bg-surface-subtle/60">
          <p className="font-bold text-ink">Credit ledger</p>
          <p className="text-sm text-text-secondary">Every grant, reserve, consume, and release.</p>
        </Link>
        <Link href="/app/billing/history" className="rounded-card border border-border-decorative bg-surface p-4 shadow-card hover:bg-surface-subtle/60">
          <p className="font-bold text-ink">Payments</p>
          <p className="text-sm text-text-secondary">Purchase history and statuses.</p>
        </Link>
      </div>

      <Card>
        <h3 className="font-bold text-ink">Current catalog</h3>
        {catalog ? (
          <>
            <p className="text-xs text-text-disabled">Catalog version {catalog.version}</p>
            <ul className="mt-3 divide-y divide-border-decorative">
              {catalog.skus.map((s) => (
                <li key={s.sku} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-semibold text-ink">{s.name}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-text-secondary">
                      {s.contactCredits} reveals · {s.aiCredits} AI
                    </span>
                    <Badge tone={s.pricePaise === 0 ? "success" : "honey"}>{s.pricePaise === 0 ? "Free" : formatINRPaise(s.pricePaise)}</Badge>
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/app/billing/plans" className="mt-3 inline-block">
              <Button size="sm" variant="secondary">Buy a pack</Button>
            </Link>
          </>
        ) : (
          <p className="mt-2 text-sm text-warning">Catalog temporarily unavailable. Purchases are paused honestly rather than showing invented prices.</p>
        )}
      </Card>
    </div>
  );
}
