import { cn } from "@/lib/cn";

/**
 * Sequence drawings. Both render a real, named order — the stages a user moves
 * through — so the graphic is the information, not decoration under it.
 */

export function StageChain({
  items,
  currentIndex,
  className,
  orientation = "vertical",
}: {
  items: Array<{ key: string; label: string }>;
  currentIndex?: number;
  className?: string;
  orientation?: "vertical" | "horizontal";
}) {
  if (orientation === "horizontal") {
    return (
      <ol className={cn("flex flex-wrap items-center gap-x-1 gap-y-2", className)}>
        {items.map((item, i) => {
          const done = currentIndex !== undefined && i < currentIndex;
          const at = currentIndex === i;
          return (
            <li key={item.key} className="flex items-center gap-1">
              <span
                className={cn(
                  "ab-press inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-semibold",
                  at
                    ? "border-honey-deep bg-honey-wash text-ink"
                    : done
                      ? "border-border-decorative bg-surface-subtle text-ink"
                      : "border-border-decorative text-text-secondary",
                )}
              >
                <CombNode n={i + 1} active={at || done} />
                {item.label}
              </span>
              {i < items.length - 1 ? (
                <svg width="14" height="8" viewBox="0 0 14 8" aria-hidden className="text-border-decorative">
                  <path d="M0 4h11M11 4l-2.5-2.5M11 4l-2.5 2.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
                </svg>
              ) : null}
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className={cn("relative space-y-2", className)}>
      <svg
        aria-hidden
        className="absolute left-[9px] top-2 h-[calc(100%-1rem)] w-[2px] text-border-decorative"
        preserveAspectRatio="none"
      >
        <path d="M1 0v100" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" fill="none" />
      </svg>
      {items.map((item, i) => {
        const done = currentIndex !== undefined && i < currentIndex;
        const at = currentIndex === i;
        return (
          <li key={item.key} className="relative flex items-center gap-3 pl-0 text-sm">
            <span className="relative z-10 flex h-[19px] w-[19px] items-center justify-center rounded-full bg-surface">
              <CombNode n={i + 1} active={at || done} />
            </span>
            <span className={cn(at ? "font-bold text-ink" : done ? "text-ink" : "text-text-secondary")}>
              {item.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function CombNode({ n, active }: { n: number; active: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 19 19" aria-hidden className={cn(active ? "text-honey-deep" : "text-border-control")}>
      <path
        d="M9.5 1.6l6.4 3.7v7.4l-6.4 3.7-6.4-3.7V5.3z"
        fill={active ? "var(--ab-honey-wash)" : "var(--ab-surface)"}
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <text
        x="9.5"
        y="12.6"
        textAnchor="middle"
        className="tabular"
        fontSize="8.5"
        fontWeight="700"
        fill="currentColor"
      >
        {n}
      </text>
    </svg>
  );
}

/**
 * The actual outreach path: search a contact, ground a draft, stage it in
 * Gmail. Three real hops, so they are drawn as a connected path.
 */
export function OutreachPath({
  steps,
  className,
}: {
  steps: Array<{ label: string; icon?: React.ReactNode }>;
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-2", className)}>
      {steps.map((step, i) => (
        <li key={step.label} className="flex items-center gap-2">
          <span className="flex items-center gap-2 text-xs font-semibold">{step.icon}{step.label}</span>
          {i < steps.length - 1 ? (
            <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden className="text-honey" opacity="0.9">
              <path d="M0 5h13M13 5l-3-3M13 5l-3 3" stroke="currentColor" strokeWidth="1.4" fill="none" />
            </svg>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
