import "./global.css";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

import { Figtree } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { LINKS } from "../lib/constants";
import { Providers } from "./providers";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0c" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://tagwise.me"),
  title: {
    default: "Tagwise Identity Protocol (TIP) | The Identity Layer for Payments on Solana",
    template: "%s | Tagwise Identity Protocol",
  },
  description:
    "Tagwise Identity Protocol (TIP) enables seamless, human-readable identity resolution for Solana payments. Transform hexadecimal wallet addresses into memorable @tags.",
  keywords: [
    "payment identity",
    "payment identity protocol",
    "identity protocol",
    "Solana identity",
    "Solana payment protocol",
    "crypto identity",
    "human-readable wallet addresses",
    "wallet resolver",
    "Solana SDK",
    "Web3 identity",
    "Tagwise",
    "TIP",
  ],
  authors: [{ name: "Tagwise Protocol Contributors", url: LINKS.GITHUB }],
  creator: "Tagwise",
  publisher: "Tagwise",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://tagwise.me",
  },
  openGraph: {
    title: "Tagwise Identity Protocol (TIP) | The Identity Layer for Payments on Solana",
    description:
      "Universal human-readable identity resolution for Solana payments. Foundational payment identity infrastructure for wallets, exchanges, and merchants.",
    url: "https://tagwise.me",
    siteName: "Tagwise Identity Protocol",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Tagwise Identity Protocol - The Identity Layer for Payments on Solana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tagwise Identity Protocol (TIP) | The Identity Layer for Payments on Solana",
    description:
      "Universal human-readable identity resolution for Solana payments. Transform hex addresses into @tags.",
    images: ["/og-image.jpg"],
    creator: "@tagwiseme",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://tagwise.me/#website",
      url: "https://tagwise.me",
      name: "Tagwise Identity Protocol (TIP)",
      description: "The Identity Layer for Payments on Solana",
      publisher: {
        "@id": "https://tagwise.me/#organization",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://tagwise.me/#organization",
      name: "Tagwise Identity Protocol",
      url: "https://tagwise.me",
      sameAs: [
        LINKS.GITHUB,
        LINKS.DOCS,
      ],
    },
    {
      "@type": "SoftwareApplication",
      name: "Tagwise Identity Protocol SDK",
      operatingSystem: "Solana",
      applicationCategory: "DeveloperApplication",
      url: LINKS.GITHUB,
      description: "Open-source SDK for human-readable identity resolution on Solana.",
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col selection:bg-teal/30 selection:text-foreground">
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
