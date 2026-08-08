import "./global.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Figtree } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { RootProvider } from "fumadocs-ui/provider/next";
import { PostHogProvider } from "../components/PostHogProvider";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Tagwise Docs",
    default: "Tagwise Docs",
  },
  description:
    "Official documentation for Tagwise Identity Protocol (TIP): public identity resolution for @tag payments on Solana.",
  icons: {
    icon: "/app-logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <PostHogProvider>
          <RootProvider>{children}</RootProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
