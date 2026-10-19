import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Editorial furniture for the pages behind the landing: the same 10rem label
 * rail as the landing sections, so a subpage never resets to a generic
 * blog-width intro.
 */

export function PageMasthead({
  eyebrow,
  title,
  lede,
  meta,
  children,
  className,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  meta?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("border-b border-border-decorative", className)}>
      <div className="mx-auto max-w-[calc(var(--ab-container-marketing))] px-5 pb-14 pt-14 sm:px-6 md:pb-20 md:pt-20 lg:px-8">
        <div className="grid gap-5 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-12 lg:gap-20">
          <p className="text-[0.8125rem] font-semibold leading-snug text-ink">{eyebrow}</p>
          <div className="min-w-0">
            <h1 className="max-w-[22ch] text-[clamp(2.5rem,5vw,4.25rem)] font-extrabold leading-[1.02] tracking-[-0.045em] text-ink">
              {title}
            </h1>
            {lede ? (
              <p className="mt-5 max-w-[58ch] text-[1.0625rem] leading-[1.7] text-text-secondary">{lede}</p>
            ) : null}
            {meta ? <p className="mt-4 text-[0.8125rem] text-text-disabled">{meta}</p> : null}
            {children ? <div className="mt-8">{children}</div> : null}
          </div>
        </div>
      </div>
    </header>
  );
}

export function ReadingShell({
  label,
  meta,
  children,
}: {
  label: React.ReactNode;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[calc(var(--ab-container-marketing))] px-5 py-14 sm:px-6 md:py-20 lg:px-8">
      <div className="grid gap-8 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-12 lg:gap-20">
        <div className="text-[0.8125rem] font-semibold leading-snug text-ink">
          {label}
          {meta ? <div className="mt-2 text-[0.75rem] font-normal text-text-disabled">{meta}</div> : null}
        </div>
        <div className="min-w-0 max-w-[68ch]">{children}</div>
      </div>
    </div>
  );
}

export function ArticleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border-decorative pt-7 first:border-t-0 first:pt-0">
      <h2 className="text-[1.25rem] font-bold tracking-[-0.025em] text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-[0.9375rem] leading-[1.75] text-text-secondary">{children}</div>
    </section>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-semibold text-ink underline decoration-border-control underline-offset-4 transition-colors hover:decoration-ink"
    >
      {children}
    </Link>
  );
}

export function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink underline decoration-border-control underline-offset-4 transition-colors hover:decoration-ink"
    >
      {children}
      <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden className="ab-slide-icon">
        <path d="M3 8h9M9 5l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </Link>
  );
}
