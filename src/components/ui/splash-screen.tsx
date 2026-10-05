"use client";

import { TetrisLoader, type TetrisLoaderProps } from "@/components/ui/loader-tetris";
import { cn } from "@/lib/utils";

export interface SplashScreenProps {
  title?: string;
  subtitle?: string;
  columns?: number;
  rows?: number;
  cellSize?: number;
  gap?: number;
  speed?: number;
  fullScreen?: boolean;
  className?: string;
  loaderProps?: Partial<TetrisLoaderProps>;
}

export function SplashScreen({
  title = "Loading ReachBee",
  subtitle = "Preparing your workspace. Watch the bot play...",
  columns = 8,
  rows = 16,
  cellSize = 5,
  gap = 2,
  speed = 40,
  fullScreen = true,
  className,
  loaderProps,
}: SplashScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center p-6 text-center select-none",
        fullScreen ? "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm" : "w-full py-16",
        className
      )}
    >
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-border/60 bg-card/80 p-8 shadow-xl backdrop-blur-md transition-all sm:flex-row sm:items-center sm:text-left">
        <TetrisLoader
          columns={columns}
          rows={rows}
          cellSize={cellSize}
          gap={gap}
          speed={speed}
          label={title}
          {...loaderProps}
        />
        <div className="space-y-1.5 max-w-xs">
          <p className="text-base font-semibold tracking-tight text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
