"use client";

import * as React from "react";
import { BrandMark } from "@/components/marketing/brand";
import { cn } from "@/lib/utils";

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

export const Logo = ({ className, size = 32, ...props }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)} {...props}>
      <BrandMark size={size} variant="honey" />
      <span className="font-extrabold text-lg tracking-tight text-foreground font-sans">
        Reach<span className="text-honey">Bee</span>
      </span>
    </div>
  );
};

export default Logo;
