import { cn } from "@/lib/cn";

/**
 * Workspace page masthead. Same ruled rhythm as the overview: a single h1,
 * a plain-language lede, and one place for the page's primary action.
 */
export function AppPageHeader({
  title,
  lede,
  actions,
  children,
  className,
}: {
  title: React.ReactNode;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("border-b border-border-decorative pb-5", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[clamp(1.5rem,2.4vw,1.875rem)] font-extrabold leading-[1.1] tracking-[-0.035em] text-ink">
            {title}
          </h1>
          {lede ? (
            <p className="mt-2 max-w-[66ch] text-[0.875rem] leading-[1.65] text-text-secondary">{lede}</p>
          ) : null}
          {children}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
