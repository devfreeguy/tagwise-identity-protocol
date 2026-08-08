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

  useEffect(() => {
    setMounted(true);
  }, []);

  const getCssVar = useCallback((varName: string) => {
    const formattedVarName = varName.startsWith("--") ? varName : `--${varName}`;
    return `var(${formattedVarName})`;
  }, []);

  return {
    background: "var(--background)",
    foreground: "var(--foreground)",
    primary: "var(--primary)",
    secondary: "var(--secondary)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    border: "var(--border)",
    
    gold: "var(--gold)",
    teal: "var(--teal)",
    coral: "var(--coral)",
    rose: "var(--rose)",
    mint: "var(--mint)",

    getCssVar,
    mounted,
    resolvedTheme,
  } as const;
}
