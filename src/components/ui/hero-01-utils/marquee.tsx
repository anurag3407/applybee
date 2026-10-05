"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MarqueeProps extends React.ComponentPropsWithoutRef<"div"> {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <>
      <style>
        {`
          @keyframes marquee {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(calc(-100% - var(--gap, 1rem)));
            }
          }

          @keyframes marquee-vertical {
            from {
              transform: translateY(0);
            }
            to {
              transform: translateY(calc(-100% - var(--gap, 1rem)));
            }
          }

          .animate-marquee {
            animation: marquee var(--duration, 30s) linear infinite;
          }

          .animate-marquee-vertical {
            animation: marquee-vertical var(--duration, 30s) linear infinite;
          }

          .animate-reverse {
            animation-direction: reverse !important;
          }

          .pause-on-hover:hover .animate-marquee,
          .pause-on-hover:hover .animate-marquee-vertical {
            animation-play-state: paused !important;
          }
        `}
      </style>
      <div
        {...props}
        className={cn(
          "group flex overflow-hidden p-2 [--duration:30s] [--gap:1.5rem]",
          {
            "flex-row": !vertical,
            "flex-col": vertical,
            "pause-on-hover": pauseOnHover,
          },
          className
        )}
      >
        {Array(repeat)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className={cn("flex shrink-0 justify-around items-center gap-8 md:gap-16", {
                "animate-marquee flex-row": !vertical,
                "animate-marquee-vertical flex-col": vertical,
                "animate-reverse": reverse,
              })}
            >
              {children}
            </div>
          ))}
      </div>
    </>
  );
}

export default Marquee;
