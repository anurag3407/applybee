import Link from "next/link";
import { cn } from "@/lib/cn";
import { FeatureIcon, type FeatureIconName } from "@/components/marketing/feature-icon";

/**
 * Landing furniture. Sections share a ruled editorial header: index on the
 * left, claim on the right. Honey is reserved for the one action or fact that
 * needs to lead; everything else is ink on paper.
 */

export function Eyebrow({ children, tone = "canvas" }: { children: React.ReactNode; tone?: "canvas" | "ink" }) {
  return (
    <p
      className={cn(
        "text-[0.75rem] font-semibold",
        tone === "ink" ? "text-surface/65" : "text-text-secondary",
      )}
      data-motion="reveal"
    >
      {children}
    </p>
  );
}

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
        "group relative border-t border-border-decorative pt-5",
        className,
      )}
    >
      <FeatureIcon
        name={icon}
        size={20}
        className="text-honey-deep transition-colors duration-200 group-hover:text-ink dark:text-honey"
      />
      <h3 className="mt-5 text-[0.9375rem] font-bold leading-snug tracking-[-0.01em] text-ink">{title}</h3>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-text-secondary">{body}</p>
      {meta ? <div className="mt-4">{meta}</div> : null}
    </Tag>
  );
}

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
        "relative overflow-hidden rounded-card border border-border-decorative bg-surface shadow-card",
        className,
      )}
      data-motion="reveal"
    >
      {label || aside ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-decorative px-5 py-3.5">
          {label ? (
            <p className="text-[0.75rem] font-semibold text-text-secondary">{label}</p>
          ) : (
            <span />
          )}
          {aside}
        </div>
      ) : null}
      <div className="p-5 md:p-6">{children}</div>
    </div>
  );
}

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
  stagger?: boolean;
}) {
  return (
    <li
      {...(stagger ? { "data-motion": "stagger-item" as const } : {})}
      className="flex items-start gap-3 border-t border-border-decorative py-4 first:border-t-0 first:pt-0 last:pb-0"
    >
      <span className={cn("mt-0.5 shrink-0", iconClass)}>
        <FeatureIcon name={icon} size={17} />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-text-disabled">{label}</span>
        <span className="mt-1 block text-[0.875rem] leading-relaxed text-ink">{children}</span>
      </span>
    </li>
  );
}

export function SectionShell({
  id,
  index,
  eyebrow,
  heading,
  lede,
  children,
  tone = "canvas",
  align = "split",
  headingClass,
  headingAs: Heading = "h2",
}: {
  id?: string;
  index?: string;
  eyebrow?: React.ReactNode;
  heading: React.ReactNode;
  lede?: React.ReactNode;
  children: React.ReactNode;
  tone?: "canvas" | "surface" | "ink";
  align?: "split" | "stack" | "center";
  headingClass?: string;
  headingAs?: "h1" | "h2";
}) {
  const ink = tone === "ink";
  return (
    <section
      id={id}
      className={cn(
        "relative",
        tone === "surface" && "border-y border-border-decorative bg-surface",
        ink && "brand-panel on-ink overflow-hidden bg-ink text-surface",
      )}
    >
      <div className="mx-auto max-w-[calc(var(--ab-container-marketing))] px-5 py-20 sm:px-6 md:py-28 lg:px-8">
        {eyebrow || heading ? (
          <header
            className={cn(
              align === "split" && "grid gap-6 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-12 lg:gap-20",
              align === "center" && "mx-auto max-w-3xl text-center",
            )}
          >
            {align === "split" ? (
              <div data-motion="reveal">
                {index ? (
                  <p className={cn("tabular text-[0.6875rem] font-semibold", ink ? "text-surface/45" : "text-text-disabled")}>
                    {index}
                  </p>
                ) : null}
                {eyebrow ? (
                  <p
                    className={cn(
                      index ? "mt-3" : "",
                      "max-w-[9rem] text-[0.8125rem] font-semibold leading-snug",
                      ink ? "text-surface/80" : "text-ink",
                    )}
                  >
                    {eyebrow}
                  </p>
                ) : null}
              </div>
            ) : align === "stack" && (index || eyebrow) ? (
              <div className="mb-5 flex items-baseline gap-3" data-motion="reveal">
                {index ? (
                  <span className={cn("tabular text-[0.6875rem] font-semibold", ink ? "text-surface/45" : "text-text-disabled")}>
                    {index}
                  </span>
                ) : null}
                {eyebrow ? (
                  <span className={cn("text-[0.8125rem] font-semibold", ink ? "text-surface/80" : "text-ink")}>
                    {eyebrow}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className={cn(align === "center" && "flex flex-col items-center")}>
              {align === "center" && (index || eyebrow) ? (
                <div className="mb-5 flex items-baseline gap-3" data-motion="reveal">
                  {index ? <span className="tabular text-[0.6875rem] font-semibold text-text-disabled">{index}</span> : null}
                  {eyebrow ? <span className="text-[0.8125rem] font-semibold text-ink">{eyebrow}</span> : null}
                </div>
              ) : null}
              <Heading
                className={cn(
                  "font-extrabold tracking-[-0.04em] leading-[1.04]",
                  ink ? "text-surface" : "text-ink",
                  align === "split" ? "max-w-[22ch]" : "max-w-[26ch]",
                  align === "center" && "mx-auto",
                  headingClass ?? "text-[clamp(1.9rem,3.3vw,2.9rem)]",
                )}
                data-motion="reveal"
              >
                {heading}
              </Heading>
              {lede ? (
                <p
                  className={cn(
                    "mt-5 max-w-[56ch] text-[1rem] leading-[1.7]",
                    ink ? "text-surface/65" : "text-text-secondary",
                    align === "center" && "mx-auto",
                  )}
                  data-motion="reveal"
                >
                  {lede}
                </p>
              ) : null}
            </div>
          </header>
        ) : null}
        <div className={cn((eyebrow || heading) && "mt-12 md:mt-16")}>{children}</div>
      </div>
    </section>
  );
}

export function QuietLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-ink underline decoration-border-control/70 underline-offset-4 transition-colors hover:decoration-ink"
    >
      {children}
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="ab-slide-icon">
        <path d="M3 8h9M9 5l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </Link>
  );
}
