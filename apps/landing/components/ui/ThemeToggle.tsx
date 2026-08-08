"use client";

import React from "react";
import { Button } from "./Button";
import { useTheme } from "next-themes";
import { useThemeColors } from "@/hooks/useThemeColors";
import { IconSun, IconMoon } from "@tabler/icons-react";

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
      className={`w-10 h-10 min-w-10 text-muted-foreground hover:text-foreground rounded-full flex items-center justify-center ${className || ""}`}
    >
      {mounted &&
        (isDark ? <IconSun size={size} /> : <IconMoon size={size} />)}
    </Button>
  );
}
