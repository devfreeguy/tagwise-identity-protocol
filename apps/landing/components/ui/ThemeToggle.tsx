"use client";

import React from "react";
import { Button } from "./Button";
import { useTheme } from "next-themes";
import { useThemeColors } from "@/hooks/useThemeColors";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { cn } from "tailwind-variants";

interface ThemeToggleProps {
  className?: string;
  size?: number;
}

export function ThemeToggle({ className, size = 18 }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const { mounted, resolvedTheme } = useThemeColors();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      isIconOnly
      variant="tertiary"
      onPress={toggleTheme}
      aria-label="Toggle dark mode"
      className={cn(
        "w-10 h-10 min-w-10 rounded-full flex items-center justify-center group",
        className,
      )}
    >
      {mounted &&
        (isDark ? (
          <IconSun
            size={size}
            className="text-muted group-hover:text-foreground"
          />
        ) : (
          <IconMoon
            size={size}
            className="text-muted group-hover:text-foreground"
          />
        ))}
    </Button>
  );
}
