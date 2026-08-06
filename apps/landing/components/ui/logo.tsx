"use client";

import { cn } from "@heroui/react";
import { LogoIcon } from "./LogoIcon";

interface LogoProps {
  showName?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({
  showName = true,
  className = "",
  size = "sm",
}: LogoProps) {
  const iconSizes = {
    sm: "w-5 h-5 text-xs",
    md: "w-6 h-6 text-sm",
    lg: "w-7 h-7 text-base",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <a
      href="#"
      className={cn("flex items-center gap-3 group shrink-0", className)}
    >
      <div
        className={cn(
          iconSizes[size],
          "flex items-center justify-center text-foreground group-hover:scale-105 transition-transform",
        )}
      >
        <LogoIcon />
      </div>

      <div
        className={cn(
          "flex items-center gap-2 transition-all duration-500 overflow-hidden",
          showName
            ? "w-auto opacity-100 scale-100"
            : "w-0 opacity-0 pointer-events-none scale-95",
        )}
      >
        <span
          className={cn(
            // "font-medium",
            textSizes[size],
            "tracking-tight text-foreground whitespace-nowrap",
          )}
        >
          Tagwise
        </span>
      </div>
    </a>
  );
}
