import type { Metadata } from "next";
import { requireActiveUser } from "@/server/auth/session";
import { getPublishedCatalog } from "@/server/services/billing";
import { CheckoutLauncher } from "@/components/billing/checkout-launcher";
import { Card, Badge } from "@/components/ui/primitives";
import { IconCheck, IconToken } from "@/components/svg/icons";
import { Reveal, Stagger } from "@/components/motion";
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
      <Reveal>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">Plans & packs</h2>
        <p className="mt-1 text-sm text-text-secondary">
          One-time purchases. Balances add. Packs never overwrite unused credits. No auto-renewal.
        </p>
      </Reveal>

      {!catalog ? (
        <Card className="border-warning/30 bg-warning-wash/40">
          <p className="font-semibold text-warning">Catalog temporarily unavailable.</p>
          <p className="text-sm text-text-secondary">We don’t fall back to invented prices. Please try again shortly.</p>
        </Card>
      ) : (
        <>
          <Reveal delay={40}>
            <Card className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-honey/50 bg-honey-wash text-honey-deep">
                <IconToken size={16} />
              </span>
              <div>
                <h3 className="font-bold text-ink">Free trial</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  {trial
                    ? `${trial.contactCredits} contact reveals and ${trial.aiCredits} AI generations, once per verified account, no card required.`
                    : "Trial is provisioned at signup."}
                </p>
              </div>
            </Card>
          </Reveal>

          <Stagger as="div" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {packs.map((s) => (
              <Card key={s.sku} interactive className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-ink">{s.name}</h3>
                  {s.sku === "plus_v1" ? <Badge tone="honey">Balanced starter pack</Badge> : null}
                </div>
                <p className="mt-2 text-[1.75rem] font-extrabold leading-none tabular tracking-tight text-ink">
                  {formatINRPaise(s.pricePaise)}
                </p>
                <p className="mt-1 text-xs font-semibold text-text-disabled">One-time purchase</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-text-secondary">
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-success" />
                    {s.contactCredits} contact reveals
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-success" />
                    {s.aiCredits} AI generations
                  </li>
                </ul>
                {s.sku === "free_trial_v1" ? null : (
                  <div className="mt-5">
                    <CheckoutLauncher
                      sku={s.sku}
                      priceLabel={formatINRPaise(s.pricePaise)}
                      salesLive={config.FEATURE_LIVE_PURCHASES_ENABLED || config.paymentsMode === "mock"}
                    />
                  </div>
                )}
              </Card>
            ))}
          </Stagger>

          <Reveal delay={80}>
            <Card>
              <h3 className="font-bold text-ink">Cost examples</h3>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                {COST_EXAMPLES.map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden className="mt-[3px] shrink-0">
                      <path
                        d="M6 1l5 2.9v6.2L6 13 1 10.1V3.9z"
                        fill="var(--ab-surface-subtle)"
                        stroke="var(--ab-border-control)"
                        strokeWidth="1.2"
                      />
                    </svg>
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-text-disabled">
                {config.paymentsMode === "mock"
                  ? "Sandbox payments: this environment simulates Razorpay with clearly labeled mock checkouts. No money moves."
                  : "Payments run through Razorpay (UPI, cards, netbanking). Credits appear on confirmed capture."}
              </p>
            </Card>
          </Reveal>
        </>
      )}
      <p className="text-xs text-text-disabled">Tax treatment as displayed; see the refunds policy for unused allowance.</p>
    </div>
  );
}

const COST_EXAMPLES = [
  "Existing contact + manual writing = free.",
  "New directory contact + AI draft = 1 reveal credit + 1 AI credit, shown together before you confirm.",
  "A failed AI generation returns the credit automatically.",
];
