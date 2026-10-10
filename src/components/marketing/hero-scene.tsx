import { Badge } from "@/components/ui/primitives";
import { DotField, SignalWaves } from "@/components/marketing/atmosphere";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import { cn } from "@/lib/cn";

/**
 * The grounding scene: three confirmed facts from a resume converge into one
 * draft that waits for you. The drawing is the claim, so it stays a finite
 * entrance (strokes draw in once on load) and carries no invented metrics.
 */

const facts = [
  {
    label: "Fact 1",
    text: "Built an events pipeline handling 40k events/min",
  },
  {
    label: "Fact 2",
    text: "Led migration of the checkout service to TypeScript",
  },
  {
    label: "Unverified",
    text: "No metric in resume, so the draft says “reduced”, not “by 38%”",
  },
];

function HexBullet({ state }: { state: "confirmed" | "open" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden className="shrink-0">
      <path
        d="M9 1.8l6.2 3.6v7.2L9 16.2 2.8 12.6V5.4z"
        fill={state === "confirmed" ? "var(--ab-honey-wash)" : "none"}
        stroke={state === "confirmed" ? "var(--ab-honey-deep)" : "var(--ab-border-control)"}
        strokeWidth="1.3"
      />
      {state === "confirmed" ? (
        <path
          d="M5.9 9.1l2.1 2.1 4.1-4.4"
          fill="none"
          stroke="var(--ab-honey-deep)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ) : (
        <path d="M9 5.6v4.2M9 11.8v.6" stroke="var(--ab-text-disabled)" strokeWidth="1.5" strokeLinecap="round" />
      )}
    </svg>
  );
}

/** Three inbound paths converging, one outbound. Drawn once on arrival. */
function Convergence({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 240"
      aria-hidden
      className={className}
      fill="none"
      preserveAspectRatio="none"
    >
      {/* The hand-off itself: a dashed line that keeps travelling. */}
      <g className="ab-draw" stroke="var(--ab-honey)" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4 34C46 34 58 110 78 118" style={{ ["--ab-len" as string]: 200 }} />
        <path d="M4 120h74" style={{ ["--ab-len" as string]: 120 }} />
        <path d="M4 206C46 206 58 130 78 122" style={{ ["--ab-len" as string]: 200 }} />
      </g>
      <path
        d="M78 120h38"
        stroke="var(--ab-honey-deep)"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="ab-flow"
      />
      <circle cx="78" cy="120" r="4.5" fill="var(--ab-honey)" className="ab-cell" style={{ ["--ab-i" as string]: 6 }} />
    </svg>
  );
}

export function HeroScene() {
  return (
    <figure className="relative" data-motion="reveal">
      <figcaption className="sr-only">
        How a grounded draft is assembled: confirmed facts converge into one email.
      </figcaption>

      {/* Window chrome row: a preview of the workspace, not a screenshot of it. */}
      <div className="relative overflow-hidden rounded-scene border border-border-decorative bg-surface ab-hairline shadow-float">
        <DotField className="ab-mask-radial opacity-70" size={16} />

        <div className="relative flex items-center gap-2 border-b border-border-decorative px-4 py-3">
          <span aria-hidden className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-border-control/50" />
            <span className="h-2 w-2 rounded-full bg-border-control/50" />
            <span className="h-2 w-2 rounded-full bg-honey" />
          </span>
          <p className="ml-1 truncate text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-text-disabled">
            Staged in your Gmail drafts
          </p>
          <p className="ml-auto shrink-0 text-[0.6875rem] font-semibold text-honey-deep dark:text-honey">
            Illustrative preview
          </p>
        </div>

        <div className="relative p-4 md:p-5">
          <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] xl:grid-cols-[minmax(0,1fr)_96px_minmax(0,1.05fr)]">
            <ul className="space-y-3" data-motion="stagger">
              {facts.map((f, i) => (
                <li
                  key={f.label}
                  data-motion="stagger-item"
                  className="flex items-start gap-2.5 rounded-card border border-border-decorative/80 bg-surface-raised/80 p-3 backdrop-blur-sm"
                >
                  <span className="pt-0.5">
                    <HexBullet state={i < 2 ? "confirmed" : "open"} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-text-disabled">
                      {f.label}
                    </span>
                    <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ink">{f.text}</span>
                  </span>
                </li>
              ))}
            </ul>

            <Convergence className="hidden h-[240px] w-full xl:block" />

            <div className="rounded-card border border-border-decorative bg-surface-raised p-4 shadow-card">
              <div className="flex items-start gap-2.5">
                <FeatureIcon name="draft" size={18} className="mt-0.5 shrink-0 text-honey-deep dark:text-honey" />
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-bold leading-snug text-ink">
                    Platform role at Lumen, background that may fit
                  </p>
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-text-secondary">
                    Hi Priya, I’m Aarav. Last year I built a realtime events pipeline doing 40k events a minute, and I saw
                    your team works on fintech analytics pipelines.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border-decorative pt-3">
                <Badge tone="success">Ready for your review</Badge>
                <span className="text-xs text-text-disabled">Nothing sends without you pressing send</span>
              </div>
            </div>
          </div>
        </div>

        {/* Outbound signal: the one place the page draws an arrow leaving. */}
        <SignalWaves
          size={168}
          className={cn(
            "pointer-events-none absolute -bottom-14 -right-14 opacity-45",
            "[mask-image:radial-gradient(circle_at_50%_50%,#000_35%,transparent_72%)]",
          )}
        />
      </div>

      {/* Floating proof line, anchored outside the frame so it reads as a note. */}
      <div
        className="absolute -bottom-5 left-4 flex items-center gap-2 rounded-pill border border-border-decorative bg-surface px-3 py-1.5 shadow-card md:left-6"
        data-motion="reveal"
      >
        <FeatureIcon name="review" size={14} className="text-success" />
        <span className="text-xs font-semibold text-ink">2 facts used · 1 unverified held back</span>
      </div>

      <p className="mt-10 text-xs text-text-disabled md:hidden">
        Three facts feed one draft. Where a number is missing, the wording stays qualitative.
      </p>
    </figure>
  );
}
