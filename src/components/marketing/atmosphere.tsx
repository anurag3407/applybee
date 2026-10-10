import { cn } from "@/lib/cn";

/**
 * Landing atmosphere — dot fields, ambient glows, the signal trace.
 *
 * Everything exported here is decorative: `aria-hidden`, absolutely positioned,
 * `pointer-events-none`. None of it states a fact, so none of it needs a text
 * alternative, and none of it is load-bearing — strip every colour and every
 * animation off this file and the layout does not move.
 *
 * All motion is low-amplitude and all of it is dropped by `prefers-reduced-motion`
 * in atmosphere.css.
 */

/** Dot lattice covering a box. `variant="hex"` offsets alternate rows. */
export function DotField({
  className,
  size = 18,
  variant = "grid",
  mask,
  radius = 1,
}: {
  className?: string;
  size?: number;
  variant?: "grid" | "hex";
  /** Fade the lattice out before it reaches a container edge. */
  mask?: "bottom" | "top" | "left" | "right" | "radial" | "x" | "none";
  radius?: number;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "ab-dots pointer-events-none absolute inset-0",
        variant === "hex" && "ab-dots-hex",
        mask === "bottom" && "ab-mask-b",
        mask === "top" && "ab-mask-t",
        mask === "left" && "ab-mask-l",
        mask === "right" && "ab-mask-r",
        mask === "radial" && "ab-mask-radial",
        mask === "x" && "ab-mask-fade-x",
        className,
      )}
      style={{
        ["--ab-dot-size" as string]: `${size}px`,
        ["--ab-dot-r" as string]: `${radius}px`,
      }}
    />
  );
}

/** Ambient colour wash. Blurred, drifting, never behind text. */
export function Glow({
  className,
  tone = "honey",
  slow,
}: {
  className?: string;
  tone?: "honey" | "ink" | "info";
  slow?: boolean;
}) {
  const stops: Record<string, string> = {
    honey: "color-mix(in oklab, var(--ab-honey) 42%, transparent)",
    ink: "color-mix(in oklab, var(--ab-ink) 10%, transparent)",
    info: "color-mix(in oklab, var(--ab-info) 24%, transparent)",
  };
  return (
    <div
      aria-hidden
      className={cn("ab-drift pointer-events-none absolute rounded-full blur-3xl", slow && "ab-drift-slow", className)}
      style={{
        background: `radial-gradient(circle, ${stops[tone]}, transparent 68%)`,
      }}
    />
  );
}

/**
 * Outbound signal rings — the radar half of the brand mark, used where the page
 * claims an outbound message leaves. Three evenly phased rings, so the eye reads
 * motion without the composition ever settling into an obvious loop.
 */
export function SignalWaves({
  className,
  size = 120,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      overflow="visible"
      className={cn("ab-signal pointer-events-none", className)}
      fill="none"
    >
      <circle cx="50" cy="50" r="18" stroke="var(--ab-honey)" strokeWidth="0.9" />
      <circle cx="50" cy="50" r="32" stroke="var(--ab-honey)" strokeWidth="0.9" />
      <circle cx="50" cy="50" r="46" stroke="var(--ab-honey)" strokeWidth="0.9" />
      <circle cx="50" cy="50" r="3" fill="var(--ab-honey-deep)" stroke="none" />
    </svg>
  );
}

/**
 * Brand tracer: comb cells lighting left to right, then resetting. Marks a
 * surface where the product is doing bounded work, so it is finite in feel and
 * carries no percentage.
 */
export function CombTrace({
  className,
  cells = 5,
  size = 18,
}: {
  className?: string;
  cells?: number;
  size?: number;
}) {
  const w = cells * (size * 0.75) + size * 0.25;
  return (
    <svg
      viewBox={`0 0 ${w} ${size}`}
      width={w}
      height={size}
      aria-hidden
      className={cn("pointer-events-none", className)}
      fill="none"
    >
      {Array.from({ length: cells }).map((_, i) => {
        const x = i * (size * 0.75);
        return (
          <path
            key={i}
            d={`M${x + size * 0.125} ${size / 2}l${size * 0.25}-${size * 0.2} ${size * 0.25} ${size * 0.2}v${size * 0.4}l-${size * 0.25} ${size * 0.2}-${size * 0.25}-${size * 0.2}z`}
            stroke="currentColor"
            strokeWidth="1"
            className="ab-cell"
            style={{ ["--ab-i" as string]: i }}
          />
        );
      })}
    </svg>
  );
}
