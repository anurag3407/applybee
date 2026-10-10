import Link from "next/link";
import { Button } from "@/components/ui/primitives";
import { BrandMark } from "@/components/marketing/brand";
import { DotField, Glow, SignalWaves } from "@/components/marketing/atmosphere";

/**
 * §12 — closing CTA. The brand mark carries the weight here rather than a
 * heading bomb: the page has already made its argument, and this is the door.
 */
export function FinalCta({ trial }: { trial: { contact: number; ai: number } | null }) {
  return (
    <section className="relative overflow-hidden border-t border-border-decorative">
      <DotField size={24} variant="hex" mask="top" className="opacity-70" />
      <Glow tone="honey" className="-bottom-40 left-1/2 h-[30rem] w-[46rem] -translate-x-1/2 opacity-25" />

      <div className="relative mx-auto max-w-[calc(var(--ab-container-marketing))] px-5 py-24 text-center md:py-36">
        <div className="relative mx-auto w-fit" data-motion="reveal">
          <BrandMark size={56} />
          <SignalWaves
            size={150}
            className="pointer-events-none absolute -right-16 -top-10 opacity-25 [mask-image:radial-gradient(circle_at_50%_50%,#000_30%,transparent_70%)]"
          />
        </div>

        <h2
          className="mx-auto mt-8 max-w-3xl font-bold tracking-[-0.04em] text-ink"
          style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", lineHeight: 1.05 }}
          data-motion="reveal"
        >
          Make your next{" "}
          <span className="font-editorial font-normal italic tracking-[-0.01em] text-honey-deep dark:text-honey">
            introduction
          </span>{" "}
          count.
        </h2>

        <p className="prose-measure mx-auto mt-6 text-[1.0625rem] leading-relaxed text-text-secondary" data-motion="reveal">
          Write one truthful message to one real person. That is the whole product, and it is enough.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3" data-motion="reveal">
          <Link href="/sign-up">
            <Button variant="accent" size="lg" className="min-h-12 px-8 shadow-float">
              Start free
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="secondary" size="lg" className="min-h-12 px-8">
              View pricing
            </Button>
          </Link>
        </div>

        {trial ? (
          <p className="mt-6 text-sm font-semibold text-text-secondary" data-motion="reveal">
            <span className="tabular">{trial.contact}</span> contact reveals ·{" "}
            <span className="tabular">{trial.ai}</span> AI generations · No card required
          </p>
        ) : null}
      </div>
    </section>
  );
}
