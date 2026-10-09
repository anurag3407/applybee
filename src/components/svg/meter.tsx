import { cn } from "@/lib/cn";

/**
 * SVG data marks. Every number rendered here must be real — a meter with an
 * invented value is worse than no meter.
 */

export function ProgressRing({
  value,
  max,
  size = 44,
  stroke = 4,
  label,
  tone = "honey",
  className,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  label?: string;
  tone?: "honey" | "ink" | "info" | "success";
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const colorVar =
    tone === "ink"
      ? "var(--ab-ink)"
      : tone === "info"
        ? "var(--ab-info)"
        : tone === "success"
          ? "var(--ab-success)"
          : "var(--ab-honey-deep)";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label ?? `${value} of ${max}`}
      className={cn("ab-ring", className)}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--ab-border-decorative)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={colorVar}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ ["--ab-dash" as string]: `${c * (1 - pct)}` }}
      />
    </svg>
  );
}

/** Horizontal comb-fill meter: used where a ring would be too small to read. */
export function HexMeter({
  value,
  max,
  cells = 10,
  className,
  label,
  tone = "honey",
}: {
  value: number;
  max: number;
  cells?: number;
  className?: string;
  label?: string;
  tone?: "honey" | "ink";
}) {
  const filled = max > 0 ? Math.round(Math.min(cells, Math.max(0, (value / max) * cells))) : 0;
  const color = tone === "ink" ? "var(--ab-ink)" : "var(--ab-honey)";
  return (
    <svg
      viewBox={`0 0 ${cells * 11 + 2} 12`}
      className={cn("h-3 w-full", className)}
      role="img"
      aria-label={label ?? `${value} of ${max} remaining`}
      preserveAspectRatio="none"
    >
      {Array.from({ length: cells }).map((_, i) => (
        <path
          key={i}
          d={`M${2 + i * 11} 6l4.5-4.4 4.5 4.4-4.5 4.4z`}
          fill={i < filled ? color : "none"}
          stroke={i < filled ? color : "var(--ab-border-decorative)"}
          strokeWidth="1"
          className="ab-cell"
          style={{ ["--ab-i" as string]: i }}
        />
      ))}
    </svg>
  );
}

/**
 * Honeycomb field — the brand motif, used only where a surface needs identity
 * (auth frame, empty sidebar footer). Never a page-wide texture.
 */
export function CombField({
  className,
  rows = 4,
  cols = 8,
  opacity = 0.5,
}: {
  className?: string;
  rows?: number;
  cols?: number;
  opacity?: number;
}) {
  const w = cols * 22 + 11;
  const h = rows * 19 + 10;
  const cells: string[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = col * 22 + (row % 2 ? 11 : 0) + 6;
      const y = row * 19 + 8;
      cells.push(`M${x} ${y}l7-5 7 5v10l-7 5-7-5z`);
    }
  }
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("pointer-events-none", className)}
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <g fill="none" stroke="var(--ab-honey)" strokeWidth="1" opacity={opacity}>
        {cells.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
