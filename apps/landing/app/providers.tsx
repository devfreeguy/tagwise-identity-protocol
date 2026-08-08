"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { PostHogProvider } from "../components/analytics/PostHogProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        {children}
      </NextThemesProvider>
    </PostHogProvider>
  );
}
