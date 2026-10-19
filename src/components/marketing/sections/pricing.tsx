import Link from "next/link";
import { Button } from "@/components/ui/primitives";
import { SectionShell } from "@/components/marketing/sections/shell";
import { formatINRPaise } from "@/lib/format";
import type { CatalogView } from "@/server/services/catalog";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import { cn } from "@/lib/cn";

const PACK_SKUS = new Set(["contacts_100_v1", "ai_25_v1"]);

/**
 * §10 — pricing. Real catalog values only. Plans and top-up packs are separate
 * groups: one row of workspaces, then the two one-credit packs, so neither row
 * has to pretend to be a full table.
 */
export function Pricing({
  catalog,
  standalone = false,
}: {
  catalog: CatalogView | null;
  standalone?: boolean;
}) {
  const plans = catalog?.skus.filter((sku) => !PACK_SKUS.has(sku.sku)) ?? [];
  const packs = catalog?.skus.filter((sku) => PACK_SKUS.has(sku.sku)) ?? [];

  return (
    <SectionShell
      tone="surface"
      id={standalone ? undefined : "pricing"}
      index={standalone ? undefined : "09"}
      eyebrow={standalone ? undefined : "Pricing"}
      align={standalone ? "stack" : "split"}
      headingAs={standalone ? "h1" : "h2"}
      heading="Pay for the preparation you need."
      lede="One-time packs. No subscription, no auto-renewal, no cancellation date. Reveals and generations add up and never overwrite unused credits."
    >
      {!catalog ? (
        <div className="rounded-card border border-warning/30 bg-warning-wash p-6" role="status">
          <p className="font-semibold text-warning">Pricing is temporarily unavailable.</p>
          <p className="mt-1.5 text-sm text-text-secondary">
            We show real prices only when our catalog loads. You can still sign in and use the free tools.
          </p>
        </div>
      ) : (
        <>
          <div
            className="grid gap-px overflow-hidden rounded-scene border border-border-decorative bg-border-decorative md:grid-cols-2 xl:grid-cols-4"
            data-motion="stagger"
          >
            {plans.map((sku) => {
              const free = sku.pricePaise === 0;
              const balanced = sku.sku === "plus_v1";
              return (
                <div
                  key={sku.sku}
                  data-motion="stagger-item"
                  className={cn(
                    "relative flex flex-col p-6",
                    balanced ? "bg-honey-wash/30 dark:bg-honey-wash/10" : "bg-surface",
                  )}
                >
                  {balanced ? <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-honey" /> : null}
                  <h3 className="min-h-10 text-[1.0625rem] font-bold tracking-[-0.02em] text-ink">{sku.name}</h3>
                  <p className="mt-1 min-h-4 text-[0.6875rem] font-semibold text-honey-deep dark:text-honey">
                    {balanced ? "Balanced starter pack" : null}
                  </p>

                  <p className="tabular mt-5 text-[2.25rem] font-extrabold leading-none tracking-[-0.04em] text-ink">
                    {free ? "₹0" : formatINRPaise(sku.pricePaise)}
                  </p>
                  <p className="mt-2 text-[0.75rem] text-text-secondary">
                    {free ? "Once per verified account" : "One-time purchase"}
                  </p>

                  <ul className="mt-6 flex-1 space-y-2.5 border-t border-border-decorative pt-5 text-[0.8125rem] text-text-secondary">
                    {[
                      {
                        icon: "directory" as const,
                        text: `${sku.contactCredits} contact ${sku.contactCredits === 1 ? "reveal" : "reveals"}`,
                      },
                      {
                        icon: "quick" as const,
                        text: `${sku.aiCredits} AI ${sku.aiCredits === 1 ? "generation" : "generations"}`,
                      },
                      { icon: "manual" as const, text: "Manual editor, templates, pipeline" },
                      { icon: "cost" as const, text: "Copy and export always included" },
                    ].map((row) => (
                      <li key={row.text} className="flex items-center gap-2.5">
                        <FeatureIcon
                          name={row.icon}
                          size={14}
                          className="shrink-0 text-honey-deep dark:text-honey"
                        />
                        <span>{row.text}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={free ? "/sign-up" : `/sign-up?sku=${sku.sku}`} className="mt-7">
                    <Button variant={balanced ? "accent" : "secondary"} size="lg" className="w-full">
                      {free ? "Start free" : "Choose"}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          {packs.length > 0 ? (
            <div className="mt-12" data-motion="reveal">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <div>
                  <h3 className="text-base font-bold tracking-[-0.01em] text-ink">Need more of one thing?</h3>
                  <p className="mt-1 text-[0.875rem] text-text-secondary">
                    Top-up packs add one credit type at a time. Balances add up.
                  </p>
                </div>
                <p className="text-[0.75rem] font-semibold text-text-disabled">One-time purchase</p>
              </div>
              <div className="mt-5 grid gap-px overflow-hidden rounded-card border border-border-decorative bg-border-decorative md:grid-cols-2">
                {packs.map((sku) => (
                  <div key={sku.sku} className="flex flex-wrap items-center gap-x-6 gap-y-4 bg-surface p-5">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[0.9375rem] font-bold text-ink">{sku.name}</h4>
                      <p className="mt-1 flex items-center gap-2 text-[0.8125rem] text-text-secondary">
                        <FeatureIcon
                          name={sku.contactCredits > 0 ? "directory" : "quick"}
                          size={14}
                          className="shrink-0 text-honey-deep dark:text-honey"
                        />
                        Adds to your existing balance
                      </p>
                    </div>
                    <p className="tabular text-[1.25rem] font-extrabold tracking-[-0.02em] text-ink">
                      {formatINRPaise(sku.pricePaise)}
                    </p>
                    <Link href={`/sign-up?sku=${sku.sku}`} className="w-full sm:w-auto">
                      <Button variant="secondary" size="md" className="w-full">
                        Choose
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 grid gap-8 border-t border-border-decorative pt-8 md:grid-cols-2 md:gap-12" data-motion="reveal">
            <div>
              <h3 className="flex items-center gap-2 text-[0.8125rem] font-bold text-ink">
                <FeatureIcon name="cost" size={15} className="text-honey-deep dark:text-honey" />
                What things cost in practice
              </h3>
              <p className="mt-2.5 text-[0.875rem] leading-[1.7] text-text-secondary">
                Already know the person? Entering your own recipient and writing manually is free. New contact plus an
                AI draft costs one reveal credit and one AI credit, shown together before you confirm.
              </p>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-[0.8125rem] font-bold text-ink">
                <FeatureIcon name="grounding" size={15} className="text-honey-deep dark:text-honey" />
                How credits behave
              </h3>
              <p className="mt-2.5 text-[0.875rem] leading-[1.7] text-text-secondary">
                Packs are one-time purchases; balances add up and never overwrite unused credits. Prices include all
                charges as displayed. See the{" "}
                <Link
                  href="/legal/refunds"
                  className="font-semibold text-ink underline decoration-border-control underline-offset-4"
                >
                  refunds policy
                </Link>
                .
              </p>
            </div>
          </div>
        </>
      )}
    </SectionShell>
  );
}
