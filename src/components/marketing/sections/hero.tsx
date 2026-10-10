import Link from "next/link";
import { Button } from "@/components/ui/primitives";
import { HeroScene } from "@/components/marketing/hero-scene";
import { DotField, Glow, SignalWaves, CombTrace } from "@/components/marketing/atmosphere";
import { FeatureIcon } from "@/components/marketing/feature-icon";

/**
 * Hero (§10.1). The claim is the heading, and everything decorative sits
 * behind it: a hex dot lattice, two off-phase colour washes, and the brand's
 * outbound signal rings. The trial numbers are real, resolved server-side, and
 * never rounded into a marketing promise.
 */
export function Hero({ trial }: { trial: { contact: number; ai: number } | null }) {
  return (
    <section className="relative overflow-hidden border-b border-border-decorative">
      <DotField size={22} variant="hex" mask="bottom" className="opacity-80" />
      <Glow tone="honey" className="-top-52 left-1/2 h-[36rem] w-[54rem] -translate-x-1/2 opacity-30" />
      <Glow tone="info" slow className="-right-32 top-10 h-[24rem] w-[24rem] opacity-40 dark:opacity-25" />

      <div className="relative mx-auto grid max-w-[calc(var(--ab-container-marketing))] items-center gap-16 px-5 pb-24 pt-14 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-12 md:pb-32 md:pt-20 lg:gap-16">
        <div>
          <p
            className="inline-flex items-center gap-2 rounded-pill border border-border-decorative bg-surface/80 px-3 py-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-text-secondary shadow-card backdrop-blur-sm"
            data-motion="reveal"
          >
            <CombTrace cells={4} size={12} className="text-honey" />
            Draft-only Gmail
          </p>

          <h1
            className="mt-6 max-w-[24ch] font-extrabold tracking-[-0.04em] text-ink"
            style={{ fontSize: "clamp(2.25rem, 3.9vw, 3.5rem)", lineHeight: 1.06 }}
            data-motion="reveal"
          >
            The career outreach workspace where you keep{" "}
            <span className="whitespace-nowrap font-editorial font-normal italic tracking-[-0.01em] text-honey-deep dark:text-honey">
              every draft
            </span>{" "}
            under your own review.
          </h1>

          <p className="prose-measure mt-7 text-[1.0625rem] leading-relaxed text-text-secondary md:text-[1.125rem]" data-motion="reveal">
            Public job boards on LinkedIn and Indeed have become algorithmic dead ends. ReachBee grounds the
            achievements you have already confirmed into bespoke introductions, staged as drafts in your own Gmail.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3" data-motion="reveal">
            <Link href="/sign-up">
              <Button variant="accent" size="lg" className="min-h-12 px-7 shadow-float">
                Start free, no card
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="secondary" size="lg" className="min-h-12 px-7">
                See how it works
              </Button>
            </Link>
          </div>

          {trial ? (
            <dl
              className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border-decorative pt-6"
              data-motion="reveal"
            >
              {[
                { k: "Contact reveals", v: trial.contact },
                { k: "AI generations", v: trial.ai },
                { k: "Manual drafting", v: "Free" },
              ].map((s) => (
                <div key={s.k}>
                  <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-text-disabled">{s.k}</dt>
                  <dd className="mt-1 tabular text-2xl font-extrabold tracking-tight text-ink">{s.v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {/* The scene sits under one more wash so it reads as the page's subject. */}
        <div className="relative">
          <SignalWaves
            size={300}
            className="pointer-events-none absolute -right-24 -top-24 opacity-25 [mask-image:radial-gradient(circle_at_50%_50%,#000_30%,transparent_70%)]"
          />
          <HeroScene />
        </div>
      </div>
    </section>
  );
}

/**
 * Three hard guarantees, stated as a band rather than cards — they are the
 * product's constraints, and constraints should read like a list you can hold
 * us to, not like features you might unlock later.
 */
export function GuaranteeBand() {
  const items = [
    {
      icon: "review" as const,
      title: "You press send",
      body: "ReachBee writes drafts. It never sends one, and it never reads your inbox.",
    },
    {
      icon: "grounding" as const,
      title: "Nothing invented",
      body: "If a number is not in your resume, the draft has no number.",
    },
    {
      icon: "cap" as const,
      title: "10 drafts a day, by design",
      body: "A ceiling that protects your personal Gmail reputation, not a limit on your work.",
    },
  ];
  return (
    <section className="border-b border-border-decorative bg-surface">
      <div className="mx-auto max-w-[calc(var(--ab-container-marketing))] px-5 py-12 md:py-14">
        <dl className="grid gap-8 md:grid-cols-3 md:gap-10" data-motion="stagger">
          {items.map((i) => (
            <div key={i.title} data-motion="stagger-item" className="group flex items-start gap-4">
              <span className="relative mt-0.5 shrink-0">
                <FeatureIcon name={i.icon} size={26} className="text-honey-deep dark:text-honey" />
              </span>
              <div>
                <dt className="text-[0.9375rem] font-bold text-ink">{i.title}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-text-secondary">{i.body}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
