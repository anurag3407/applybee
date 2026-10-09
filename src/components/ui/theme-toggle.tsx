"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "@/components/svg/icons";
import { cn } from "@/lib/utils";

/**
 * Theme control. Draws from tokens only — no one-off hex, no aura: the icon
 * swap itself is the feedback.
 */
export interface ThemeToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "icon" | "pill";
  showLabel?: boolean;
}

export function ThemeToggle({
  className,
  variant = "icon",
  showLabel = false,
  ...props
}: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    document.documentElement.style.colorScheme = nextDark ? "dark" : "light";
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    setIsDark(nextDark);
  };

  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label={label}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-control border border-border-decorative bg-surface text-text-disabled",
          className,
        )}
        {...props}
      >
        <IconSun size={16} />
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={label}
        className={cn(
          "ab-press group inline-flex items-center gap-2 rounded-pill border border-border-decorative px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-subtle",
          className,
        )}
        {...props}
      >
        <span aria-hidden className="relative flex h-4 w-4 items-center justify-center">
          <ThemeIcon isDark={isDark} />
        </span>
        <span>{isDark ? "Dark mode" : "Light mode"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        "ab-press inline-flex h-9 w-9 items-center justify-center rounded-control border border-border-decorative",
        "text-text-secondary hover:bg-surface-subtle hover:text-ink",
        className,
      )}
      {...props}
    >
      <span aria-hidden className="relative flex h-[18px] w-[18px] items-center justify-center">
        <ThemeIcon isDark={isDark} />
      </span>
      {showLabel && <span className="sr-only">{label}</span>}
    </button>
  );
}

/** Crossfade + turn: one glyph leaves as the other arrives. */
function ThemeIcon({ isDark }: { isDark: boolean }) {
  return (
    <>
      <IconSun
        size={18}
        className={cn(
          "transition-all duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          isDark ? "absolute -rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100",
        )}
      />
      <IconMoon
        size={18}
        className={cn(
          "transition-all duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          isDark ? "rotate-0 scale-100 opacity-100" : "absolute rotate-90 scale-50 opacity-0",
        )}
      />
    </>
  );
}

export default ThemeToggle;
