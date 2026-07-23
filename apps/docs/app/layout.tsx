import "./global.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { RootProvider } from "fumadocs-ui/provider/next";

export const metadata: Metadata = {
  title: {
    template: "%s | Tagwise Docs",
    default: "Tagwise Docs",
  },
  description: "Official documentation for Tagwise Identity Protocol (TIP): public identity resolution for @tag payments on Solana.",
  icons: {
    icon: "/logo.jpg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
