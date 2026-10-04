import type { Metadata } from "next";
import { requireActiveUser } from "@/server/auth/session";
import { getPublishedCatalog } from "@/server/services/billing";
import { CheckoutLauncher } from "@/components/billing/checkout-launcher";
import { Card, Badge } from "@/components/ui/primitives";
import { formatINRPaise } from "@/lib/format";
import { getConfig } from "@/server/config";

export const metadata: Metadata = { title: "Plans & packs" };

export default async function PlansPage() {
  await requireActiveUser();
  const [catalog, config] = await Promise.all([getPublishedCatalog(), import("@/server/config").then((m) => m.getConfig())]);
  const trial = catalog?.skus.find((s) => s.sku === "free_trial_v1");
  const packs = catalog?.skus.filter((s) => s.sku !== "free_trial_v1") ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Plans & packs</h2>
        <p className="text-sm text-text-secondary">
          One-time purchases. Balances add — packs never overwrite unused credits. No auto-renewal.
        </p>
      </div>

      {!catalog ? (
        <Card className="border-warning/30 bg-warning-wash/40">
          <p className="font-semibold text-warning">Catalog temporarily unavailable.</p>
          <p className="text-sm text-text-secondary">We don’t fall back to invented prices. Please try again shortly.</p>
        </Card>
      ) : (
        <>
          <Card>
            <h3 className="font-bold text-ink">Free trial</h3>
            <p className="mt-1 text-sm text-text-secondary">
              {trial ? `${trial.contactCredits} contact reveals and ${trial.aiCredits} AI generations — once per verified account, no card required.` : "Trial is provisioned at signup."}
            </p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {packs.map((s) => (
              <Card key={s.sku} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-ink">{s.name}</h3>
                  {s.sku === "plus_v1" ? <Badge tone="honey">Balanced starter pack</Badge> : null}
                </div>
                <p className="mt-1 text-2xl font-bold tabular text-ink">{formatINRPaise(s.pricePaise)}</p>
                <p className="text-xs font-semibold text-text-secondary">One-time purchase</p>
                <ul className="mt-3 flex-1 space-y-1 text-sm text-text-secondary">
                  <li>{s.contactCredits} contact reveals</li>
                  <li>{s.aiCredits} AI generations</li>
                </ul>
                {s.sku === "free_trial_v1" ? null : (
                  <CheckoutLauncher
                    sku={s.sku}
                    priceLabel={formatINRPaise(s.pricePaise)}
                    salesLive={config.FEATURE_LIVE_PURCHASES_ENABLED || config.paymentsMode === "mock"}
                  />
                )}
              </Card>
            ))}
          </div>

          <Card>
            <h3 className="font-bold text-ink">Cost examples</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-text-secondary">
              <li>• Existing contact + manual writing = free.</li>
              <li>• New directory contact + AI draft = 1 reveal credit + 1 AI credit, shown together before you confirm.</li>
              <li>• A failed AI generation returns the credit automatically.</li>
            </ul>
            <p className="mt-3 text-xs text-text-disabled">
              {config.paymentsMode === "mock"
                ? "Sandbox payments: this environment simulates Razorpay with clearly labeled mock checkouts — no money moves."
                : "Payments run through Razorpay (UPI, cards, netbanking). Credits appear on confirmed capture."}
            </p>
          </Card>
        </>
      )}
      <p className="text-xs text-text-disabled">Tax treatment as displayed; see the refunds policy for unused allowance.</p>
    </div>
  );
}
