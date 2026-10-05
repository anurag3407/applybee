"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const hasDarkClass = document.documentElement.classList.contains("dark");
    setIsDark(hasDarkClass);

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
    if (nextDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
      localStorage.setItem("theme", "light");
      setIsDark(false);
    }
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle dark mode"
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-ink transition-all hover:bg-surface-subtle",
          className
        )}
        {...props}
      >
        <span className="h-4 w-4 rounded-full bg-border-control opacity-40 animate-pulse" />
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={cn(
          "group relative inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300",
          isDark
            ? "border-sky-400/30 bg-[#0c182b]/90 text-sky-200 shadow-[0_0_14px_rgba(56,189,248,0.22)] hover:border-sky-400/50"
            : "border-border-control bg-surface text-ink hover:bg-surface-subtle",
          className
        )}
        {...props}
      >
        <span className="relative flex h-3.5 w-3.5 items-center justify-center">
          {isDark ? (
            <Moon className="h-3.5 w-3.5 text-sky-400 drop-shadow-[0_0_6px_#38bdf8] transition-transform duration-300 group-hover:rotate-12" />
          ) : (
            <Sun className="h-3.5 w-3.5 text-amber-500 transition-transform duration-300 group-hover:rotate-45" />
          )}
        </span>
        <span>{isDark ? "Dark mode" : "Light mode"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "group relative inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-300",
        isDark
          ? "border-white/[0.12] bg-[#121318] text-white shadow-[0_0_16px_rgba(56,189,248,0.18)] hover:border-sky-400/50 hover:bg-[#161a24]"
          : "border-border-control bg-surface text-ink hover:bg-surface-subtle hover:text-ink",
        className
      )}
      {...props}
    >
      <div className="relative flex items-center justify-center">
        {/* Sun Icon */}
        <Sun
          className={cn(
            "h-4 w-4 transition-all duration-300",
            isDark
              ? "scale-0 -rotate-90 opacity-0 absolute"
              : "scale-100 rotate-0 opacity-100 text-amber-600 group-hover:rotate-45"
          )}
        />
        {/* Moon Icon with glowing cyan aura */}
        <Moon
          className={cn(
            "h-4 w-4 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)] transition-all duration-300",
            isDark
              ? "scale-100 rotate-0 opacity-100 group-hover:rotate-12"
              : "scale-0 rotate-90 opacity-0 absolute"
          )}
        />
      </div>
      {showLabel && (
        <span className="sr-only">
          {isDark ? "Switch to light mode" : "Switch to dark mode"}
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;
