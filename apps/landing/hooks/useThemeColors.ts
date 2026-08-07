"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useCallback } from "react";

export type ThemeColors = {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  border: string;
  
  // Custom brand colors from globals.css
  gold: string;
  teal: string;
  coral: string;
  rose: string;
  mint: string;
};

/**
 * A hook to retrieve CSS variable values (e.g. colors) as string variables.
 * It provides ready-made common colors (foreground, background, etc) for immediate use.
 */
export function useThemeColors() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [colors, setColors] = useState<Partial<ThemeColors>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const getCssVar = useCallback(
    (varName: string) => {
      if (typeof window === "undefined" || !mounted) return "";
      
      const formattedVarName = varName.startsWith("--") ? varName : `--${varName}`;
      let val = getComputedStyle(document.documentElement).getPropertyValue(formattedVarName).trim();
      
      // If a color is just space-separated numbers (common in Tailwind/HeroUI raw vars), we can wrap it if needed.
      // But typically we return it as-is and let the consumer decide.
      return val;
    },
    [mounted, resolvedTheme]
  );

  useEffect(() => {
    if (!mounted) return;

    // Load ready-made colors
    // Try both standard '--color-name' and just '--name' to ensure compatibility with Tailwind v4 & HeroUI
    setColors({
      background: getCssVar("background") || getCssVar("color-background"),
      foreground: getCssVar("foreground") || getCssVar("color-foreground"),
      primary: getCssVar("primary") || getCssVar("color-primary"),
      secondary: getCssVar("secondary") || getCssVar("color-secondary"),
      success: getCssVar("success") || getCssVar("color-success"),
      warning: getCssVar("warning") || getCssVar("color-warning"),
      danger: getCssVar("danger") || getCssVar("color-danger"),
      border: getCssVar("border") || getCssVar("color-border"),
      
      gold: getCssVar("gold"),
      teal: getCssVar("teal"),
      coral: getCssVar("coral"),
      rose: getCssVar("rose"),
      mint: getCssVar("mint"),
    });
  }, [mounted, resolvedTheme, getCssVar]);

  return {
    ...colors,
    getCssVar,
    mounted,
    resolvedTheme,
  };
}
