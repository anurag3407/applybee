import { cn } from "@/lib/cn";

/**
 * Landing feature glyphs.
 *
 * One 24 × 24 stroke grid, one 1.6 weight, `currentColor` throughout — so a row
 * of them reads as a set, inherits whatever tone its container sets, and never
 * needs its own colour decisions. Each silhouette is deliberately distinct: a
 * skimming reader should be able to match icon to feature before reading a word.
 *
 * Every path carries `--ab-len` close to its real length so the stroke-draw
 * entrance in `.ab-glyph` reads at icon scale instead of snapping in.
 */

export type FeatureIconName =
  | "directory"
  | "grounding"
  | "draft"
  | "cap"
  | "review"
  | "manual"
  | "quick"
  | "agentic"
  | "pipeline"
  | "gmail"
  | "privacy"
  | "cost";

const glyphs: Record<FeatureIconName, React.ReactNode> = {
  /* Hex target with signal arcs either side: the directory. */
  directory: (
    <>
      <path d="M12 2.6l7.9 4.6v9.2L12 21l-7.9-4.6V7.2z" style={{ ["--ab-len" as string]: 54 }} />
      <path d="M16.4 7.6a4.8 4.8 0 0 1 0 8.8" style={{ ["--ab-len" as string]: 15 }} />
      <path d="M7.6 16.4a4.8 4.8 0 0 1 0-8.8" style={{ ["--ab-len" as string]: 15 }} />
      <circle cx="12" cy="12" r="2.4" style={{ ["--ab-len" as string]: 15 }} />
    </>
  ),

  /* Shield with a check: what the Grounding Engine refuses to invent. */
  grounding: (
    <>
      <path
        d="M12 2.8l7 2.9v5.6c0 4.3-2.9 7.9-7 8.9-4.1-1-7-4.6-7-8.9V5.7z"
        style={{ ["--ab-len" as string]: 46 }}
      />
      <path d="M8.8 12.1l2.3 2.3 4.4-4.7" style={{ ["--ab-len" as string]: 12 }} />
    </>
  ),

  /* Envelope: the draft that waits in your mailbox. */
  draft: (
    <>
      <rect x="2.6" y="5.4" width="18.8" height="13.2" rx="2.4" style={{ ["--ab-len" as string]: 64 }} />
      <path d="M3.6 7.2L12 13.2l8.4-6" style={{ ["--ab-len" as string]: 22 }} />
    </>
  ),

  /* Gauge against its cap: the 10/day deliverability ceiling. */
  cap: (
    <>
      <path d="M3.6 17.6a8.4 8.4 0 1 1 16.8 0" style={{ ["--ab-len" as string]: 27 }} />
      <path d="M12 17.6l4.4-5" style={{ ["--ab-len" as string]: 8 }} />
      <path d="M19.2 7.2l1.9-1.9" style={{ ["--ab-len" as string]: 4 }} />
      <circle cx="12" cy="17.6" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),

  /* Eye: the review step that nothing gets past. */
  review: (
    <>
      <path d="M2.6 12S6 6.2 12 6.2 21.4 12 21.4 12 18 17.8 12 17.8 2.6 12 2.6 12z" style={{ ["--ab-len" as string]: 44 }} />
      <circle cx="12" cy="12" r="2.8" style={{ ["--ab-len" as string]: 18 }} />
    </>
  ),

  /* Pencil on a ruled line: manual writing, no credits spent. */
  manual: (
    <>
      <path d="M4.4 19.6l1-3.7L15.8 5.5l2.7 2.7L8.1 18.6z" style={{ ["--ab-len" as string]: 42 }} />
      <path d="M14.1 7.2l2.7 2.7" style={{ ["--ab-len" as string]: 6 }} />
    </>
  ),

  /* Sparkle: one generation, one credit. */
  quick: (
    <>
      <path
        d="M10.4 3.2l1.6 4.6 4.6 1.6-4.6 1.6-1.6 4.6-1.6-4.6L4.2 9.4l4.6-1.6z"
        style={{ ["--ab-len" as string]: 38 }}
      />
      <path d="M17.8 14.2l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" style={{ ["--ab-len" as string]: 18 }} />
    </>
  ),

  /* Three in, one out: bounded preparation converging on a single draft. */
  agentic: (
    <>
      <path d="M3 5.4v2.6a3 3 0 0 0 3 3h10.6" style={{ ["--ab-len" as string]: 20 }} />
      <path d="M3 12h12.6" style={{ ["--ab-len" as string]: 13 }} />
      <path d="M3 18.6v-2.6a3 3 0 0 1 3-3h10.6" style={{ ["--ab-len" as string]: 20 }} />
      <circle cx="19" cy="12" r="1.8" fill="currentColor" stroke="none" />
    </>
  ),

  /* Kanban: the pipeline board, tallest stage first. */
  pipeline: (
    <>
      <path d="M3.6 5h4.6v14H3.6z" style={{ ["--ab-len" as string]: 37 }} />
      <path d="M9.7 5H14.3v9.4H9.7z" style={{ ["--ab-len" as string]: 29 }} />
      <path d="M15.7 5h4.7v6.2h-4.7z" style={{ ["--ab-len" as string]: 22 }} />
    </>
  ),

  /* Linked Gmail: optional, separate, disconnectable. */
  gmail: (
    <>
      <path d="M4.8 10.6V7.8a3.8 3.8 0 0 1 7.6 0v2.8" style={{ ["--ab-len" as string]: 22 }} />
      <rect x="4.4" y="10.4" width="14.8" height="10.4" rx="2.4" style={{ ["--ab-len" as string]: 50 }} />
      <circle cx="11.8" cy="15.6" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),

  /* Lock: resumes and emails stay behind your session. */
  privacy: (
    <>
      <rect x="4.6" y="10.2" width="14.8" height="10.6" rx="2.4" style={{ ["--ab-len" as string]: 50 }} />
      <path d="M8.2 10.2V7.6a3.8 3.8 0 0 1 7.6 0v2.6" style={{ ["--ab-len" as string]: 22 }} />
      <circle cx="12" cy="15.4" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),

  /* Credit hex: a balance you can see the whole shape of. */
  cost: (
    <>
      <path d="M12 2.8l7.8 4.5v9.4L12 21.2 4.2 16.7V7.3z" style={{ ["--ab-len" as string]: 54 }} />
      <path d="M9 10.4h6M9 13.8h6" style={{ ["--ab-len" as string]: 12 }} />
    </>
  ),
};

export function FeatureIcon({
  name,
  className,
  size = 22,
  strokeWidth = 1.6,
}: {
  name: FeatureIconName;
  className?: string;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("ab-glyph", className)}
    >
      {glyphs[name]}
    </svg>
  );
}

/**
 * Hex plate behind a feature glyph. The wash fills on group-hover so the card
 * answers the pointer without the icon changing weight or moving.
 */
export function IconHex({
  name,
  className,
  size = 48,
  iconSize = 22,
  tone = "honey",
}: {
  name: FeatureIconName;
  className?: string;
  size?: number;
  iconSize?: number;
  tone?: "honey" | "ink";
}) {
  return (
    <span
      className={cn(
        "group/hex relative inline-flex shrink-0 items-center justify-center",
        tone === "ink" ? "text-ink" : "text-honey-deep dark:text-honey",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 48 48"
        aria-hidden
        width={size}
        height={size}
        className="absolute inset-0 h-full w-full"
      >
        <path
          d="M24 2.4l19.4 11.2v22.4L24 47.2 4.6 35.6V13.6z"
          className={cn(
            "transition-[fill,stroke] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            "fill-honey-wash stroke-honey/45 group-hover/hex:fill-honey-wash group-hover/hex:stroke-honey",
            "dark:stroke-honey/40",
          )}
          strokeWidth="1.1"
        />
      </svg>
      <FeatureIcon name={name} size={iconSize} className="relative" />
    </span>
  );
}
