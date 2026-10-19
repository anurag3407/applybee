import Link from "next/link";
import { Button } from "@/components/ui/primitives";
import { BrandMark } from "@/components/marketing/brand";

/**
 * §12 — closing CTA. The page has made its argument; this is the door.
 */
export function FinalCta({ trial }: { trial: { contact: number; ai: number } | null }) {
  return (
    <section className="brand-panel on-ink relative overflow-hidden bg-ink text-surface">
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-honey/35" />
      <div className="mx-auto grid max-w-[calc(var(--ab-container-marketing))] items-end gap-12 px-5 py-20 sm:px-6 md:py-28 lg:grid-cols-[minmax(0,1.3fr)_auto] lg:px-8">
        <div>
          <p className="flex items-center gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-surface/50" data-motion="reveal">
            <BrandMark size={18} variant="mono" className="text-surface" />
            Start with one real person
          </p>

          <h2
            className="mt-8 max-w-[16ch] font-extrabold leading-[0.98] tracking-[-0.045em] text-surface"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4.25rem)" }}
            data-motion="reveal"
          >
            Make your next introduction count.
          </h2>

          <p className="mt-6 max-w-[46ch] text-[1rem] leading-[1.7] text-surface/65" data-motion="reveal">
            Write one truthful message to one real person. That is the whole product, and it is enough.
          </p>
        </div>

        <div className="lg:pb-2 lg:text-right" data-motion="reveal">
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/sign-up">
              <Button variant="accent" size="lg" className="px-6">
                Start free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                variant="secondary"
                size="lg"
                className="border-surface/25 px-6 text-surface hover:border-surface/40 hover:bg-surface/10"
              >
                View pricing
              </Button>
            </Link>
          </div>
          {trial ? (
            <p className="mt-5 text-[0.75rem] font-medium text-surface/50">
              <span className="tabular text-surface/80">{trial.contact}</span> contact reveals ·{" "}
              <span className="tabular text-surface/80">{trial.ai}</span> AI generations · No card required
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
