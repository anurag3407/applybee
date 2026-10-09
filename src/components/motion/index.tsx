"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * App-side motion. Rules this layer follows:
 * - Progressive enhancement: content is visible with JS off; hidden states are
 *   applied in a ref callback (before first paint) only when motion can run.
 * - Entrance only. Nothing animates forever.
 * - Exits are faster than enters.
 * - prefers-reduced-motion: every effect resolves to its final state instantly.
 */

function motionOk() {
  if (typeof window === "undefined") return true;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Reveal on scroll, once. `y` is the travel distance in px. */
export function Reveal({
  as: Tag = "div",
  className,
  children,
  delay = 0,
  y = 14,
  ...rest
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  delay?: number;
  y?: number;
  [key: string]: unknown;
}) {
  const ref = useRef<HTMLElement | null>(null);

  const attach = (node: HTMLElement | null) => {
    ref.current = node;
    if (!node || !motionOk() || !("IntersectionObserver" in window)) return;
    node.style.setProperty("--ab-reveal-y", `${y}px`);
    node.style.setProperty("--ab-reveal-delay", `${delay}ms`);
    node.classList.add("ab-pre");
  };

  useEffect(() => {
    const node = ref.current;
    if (!node || !node.classList.contains("ab-pre")) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("ab-in");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.01 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={attach} className={className} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Stagger a list as it enters. Delays come from nth-child so children need no
 * client code; capped at 10 items, after which the rhythm is already set.
 */
export function Stagger({
  className,
  children,
  as: Tag = "div",
  ...rest
}: {
  className?: string;
  children: ReactNode;
  as?: ElementType;
  [key: string]: unknown;
}) {
  const ref = useRef<HTMLElement | null>(null);

  const attach = (node: HTMLElement | null) => {
    ref.current = node;
    if (!node || !motionOk() || !("IntersectionObserver" in window)) return;
    node.classList.add("ab-pre");
  };

  useEffect(() => {
    const node = ref.current;
    if (!node || !node.classList.contains("ab-pre")) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("ab-in");
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.01 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={attach} className={cn("ab-stagger", className)} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Count to a real value on mount. Numbers settle rather than appear, which
 * makes a small balance feel deliberate instead of flickered in.
 */
export function CountUp({
  value,
  duration = 620,
  className,
  format = (n: number) => String(n),
}: {
  value: number;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!motionOk()) {
      setShown(value);
      return;
    }
    const from = fromRef.current;
    if (from === value) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className={cn("tabular", className)}>{format(shown)}</span>
  );
}

/** Route/body enter: one short rise, then nothing moves. */
export function PageEnter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("ab-page-enter", className)}>{children}</div>;
}
