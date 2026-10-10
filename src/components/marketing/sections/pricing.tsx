import Link from "next/link";
import { Button, Badge } from "@/components/ui/primitives";
import { SectionShell } from "@/components/marketing/sections/shell";
import { formatINRPaise } from "@/lib/format";
import type { CatalogView } from "@/server/services/catalog";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import { cn } from "@/lib/cn";

/**
 * §10 — pricing. Prices come from the real catalog, resolved server-side; when
 * it is unavailable the section says so instead of showing a placeholder number.
 * The middle tier is the only one with an accent border — one key action per
 * view, and everything else stays quiet.
 */
export function Pricing({ catalog }: { catalog: CatalogView | null }) {
  return (
    <SectionShell
      tone="surface"
      id="pricing"
      eyebrow="Pricing"
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
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4" data-motion="stagger">
            {catalog.skus.map((sku) => {
              const free = sku.pricePaise === 0;
              const balanced = sku.sku === "plus_v1";
              return (
                <div
                  key={sku.sku}
                  data-motion="stagger-item"
                  className={cn(
                    "group ab-sheen relative flex flex-col rounded-card border bg-surface p-6",
                    "transition-[transform,border-color,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                    "hover:-translate-y-0.5 hover:shadow-float",
                    balanced ? "border-honey shadow-float" : "border-border-decorative shadow-card hover:border-ink/25",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[1.0625rem] font-bold text-ink">{sku.name}</h3>
                    {balanced ? <Badge tone="honey">Balanced starter pack</Badge> : null}
                  </div>

                  <p className="mt-5 tabular text-[2.5rem] font-extrabold leading-none tracking-[-0.03em] text-ink">
                    {free ? "₹0" : formatINRPaise(sku.pricePaise)}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-text-secondary">
                    {free ? "Once per verified account" : "One-time purchase"}
                  </p>

                  <ul className="mt-6 flex-1 space-y-2.5 border-t border-border-decorative pt-5 text-sm text-text-secondary">
                    {[
                      { icon: "directory" as const, text: `${sku.contactCredits} contact ${sku.contactCredits === 1 ? "reveal" : "reveals"}` },
                      { icon: "quick" as const, text: `${sku.aiCredits} AI ${sku.aiCredits === 1 ? "generation" : "generations"}` },
                      { icon: "manual" as const, text: "Manual editor, templates, pipeline" },
                      { icon: "cost" as const, text: "Copy/export always included" },
                    ].map((row) => (
                      <li key={row.text} className="flex items-center gap-2.5">
                        <FeatureIcon name={row.icon} size={15} className="shrink-0 text-honey-deep dark:text-honey" />
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

          <div
            className="mt-8 grid gap-6 rounded-card border border-border-decorative bg-canvas p-6 md:grid-cols-2 md:gap-8"
            data-motion="reveal"
          >
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                <FeatureIcon name="cost" size={16} className="text-honey-deep dark:text-honey" />
                What things cost in practice
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-text-secondary">
                Already know the person? Entering your own recipient and writing manually is free — no reveal, no AI
                charge. New contact + AI draft = one reveal credit and one AI credit, shown together before you confirm.
              </p>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                <FeatureIcon name="grounding" size={16} className="text-honey-deep dark:text-honey" />
                How credits behave
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-text-secondary">
                Packs are one-time purchases; balances add up and never overwrite unused credits. Prices are inclusive as
                displayed — see the{" "}
                <Link href="/legal/refunds" className="font-semibold text-ink underline underline-offset-4">
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
