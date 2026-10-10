import Link from "next/link";
import { cn } from "@/lib/cn";
import { DotField } from "@/components/marketing/atmosphere";
import { IconHex, type FeatureIconName } from "@/components/marketing/feature-icon";

/**
 * Shared landing furniture (§10). Every section is the same three-part
 * skeleton — eyebrow, heading, body — so the page reads as one document
 * instead of twelve unrelated blocks. Nothing here carries a claim; the copy
 * does that.
 */

/** Small tracked label above a heading. */
export function Eyebrow({ children, tone = "canvas" }: { children: React.ReactNode; tone?: "canvas" | "ink" }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-pill border px-3 py-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.14em]",
        tone === "ink" ? "border-surface/25 text-honey" : "border-border-decorative bg-surface text-text-secondary",
      )}
      data-motion="reveal"
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-honey" />
      {children}
    </p>
  );
}

/** One card in a feature grid: hex icon, title, body, optional footnote. */
export function FeatureCard({
  icon,
  title,
  body,
  meta,
  className,
  as: Tag = "div",
}: {
  icon: FeatureIconName;
  title: string;
  body: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  return (
    <Tag
      data-motion="stagger-item"
      className={cn(
        "group ab-sheen relative overflow-hidden rounded-card border border-border-decorative bg-surface p-6",
        "shadow-card transition-[transform,border-color,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-float",
        className,
      )}
    >
      <IconHex name={icon} />
      <h3 className="mt-5 text-[1.0625rem] font-bold leading-snug tracking-[-0.01em] text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</p>
      {meta ? <div className="mt-4 border-t border-border-decorative pt-3">{meta}</div> : null}
    </Tag>
  );
}

/** Panel used for illustrative previews. Never a screenshot of a real account. */
export function PreviewPanel({
  children,
  className,
  label,
  aside,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "ab-hairline relative overflow-hidden rounded-scene border border-border-decorative bg-surface p-4 shadow-card md:p-5",
        className,
      )}
      data-motion="reveal"
    >
      {label || aside ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {label ? (
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-text-disabled">{label}</p>
          ) : (
            <span />
          )}
          {aside}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/** Inline callout row: icon, label, text. Used inside evidence-style panels. */
export function NoteRow({
  icon,
  label,
  children,
  iconClass,
  stagger,
}: {
  icon: FeatureIconName;
  label: string;
  children: React.ReactNode;
  iconClass?: string;
  /** Adds this row to a scroll-stagger group as an item. */
  stagger?: boolean;
}) {
  return (
    <li
      {...(stagger ? { "data-motion": "stagger-item" as const } : {})}
      className="flex items-start gap-3 rounded-control border border-border-decorative/70 bg-canvas/60 p-3.5"
    >
      <span className={cn("mt-0.5 shrink-0", iconClass)}>
        <IconHex name={icon} size={34} iconSize={17} />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-text-disabled">{label}</span>
        <span className="mt-1 block text-sm leading-relaxed text-ink">{children}</span>
      </span>
    </li>
  );
}

export function SectionShell({
  id,
  eyebrow,
  heading,
  lede,
  children,
  tone = "canvas",
  align = "start",
  headingClass,
  /** Decorative lattice. Off for panels that already carry a texture. */
  dots = true,
}: {
  id?: string;
  eyebrow?: React.ReactNode;
  heading: React.ReactNode;
  lede?: React.ReactNode;
  children: React.ReactNode;
  tone?: "canvas" | "surface" | "ink";
  align?: "start" | "center";
  headingClass?: string;
  dots?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative overflow-hidden",
        tone === "surface" && "border-y border-border-decorative bg-surface",
        tone === "ink" && "brand-panel on-ink bg-ink text-surface",
      )}
    >
      {dots ? (
        <DotField
          size={26}
          variant="hex"
          mask="bottom"
          className={cn("opacity-70", tone === "ink" && "opacity-25")}
        />
      ) : null}

      <div className="relative mx-auto max-w-[calc(var(--ab-container-marketing))] px-5 py-20 md:py-28">
        {eyebrow || heading ? (
          <header className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
            {eyebrow ? <Eyebrow tone={tone === "ink" ? "ink" : "canvas"}>{eyebrow}</Eyebrow> : null}
            <h2
              className={cn(
                "mt-5 font-bold tracking-[-0.02em]",
                tone === "ink" ? "text-surface" : "text-ink",
                headingClass ?? "text-[clamp(1.9rem,3.6vw,3rem)]",
                "leading-[1.1]",
              )}
              data-motion="reveal"
            >
              {heading}
            </h2>
            {lede ? (
              <p
                className={cn(
                  "prose-measure mt-5 text-[1.0625rem] leading-relaxed",
                  tone === "ink" ? "text-surface/75" : "text-text-secondary",
                  align === "center" && "mx-auto",
                )}
                data-motion="reveal"
              >
                {lede}
              </p>
            ) : null}
          </header>
        ) : null}
        <div className={cn((eyebrow || heading) && "mt-12 md:mt-14")}>{children}</div>
      </div>
    </section>
  );
}

/** Ghost link that reads as an action without competing with the CTA. */
export function QuietLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="ab-slide group/ql inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline decoration-border-control underline-offset-4 transition-colors hover:decoration-ink"
    >
      {children}
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="ab-slide-icon">
        <path d="M3 8h9M9 5l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </Link>
  );
}
