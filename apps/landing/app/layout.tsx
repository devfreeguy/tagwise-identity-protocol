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
    default:
      "Tagwise Identity Protocol (TIP) | The Identity Layer for Solana Payments",
    template: "%s | Tagwise Identity Protocol",
  },

  description:
    "Tagwise Identity Protocol (TIP) enables human-readable identity resolution for Solana payments by replacing long wallet addresses with memorable @tags.",

  keywords: [
    "Tagwise",
    "Tagwise Identity Protocol",
    "TIP",
    "Solana",
    "Solana payments",
    "payment identity",
    "payment identity protocol",
    "identity protocol",
    "Solana identity",
    "crypto identity",
    "wallet resolver",
    "wallet address resolver",
    "human-readable wallet addresses",
    "wallet aliases",
    "@tags",
    "Web3 identity",
    "Solana SDK",
  ],

  authors: [
    {
      name: "Tagwise Protocol Contributors",
      url: LINKS.GITHUB,
    },
  ],

  creator: "Tagwise",
  publisher: "Tagwise",
  applicationName: "Tagwise Identity Protocol",
  category: "Technology",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  alternates: {
    canonical: "https://tagwise.me",
  },

  openGraph: {
    title:
      "Tagwise Identity Protocol (TIP) | The Identity Layer for Solana Payments",

    description:
      "Universal human-readable identity resolution for Solana payments. Payment identity infrastructure for wallets, exchanges, and merchants.",

    url: "https://tagwise.me",
    siteName: "Tagwise Identity Protocol",
    locale: "en_US",
    type: "website",

    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Tagwise Identity Protocol (TIP)",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title:
      "Tagwise Identity Protocol (TIP) | The Identity Layer for Solana Payments",

    description:
      "Universal identity resolution for Solana payments. Replace long wallet addresses with memorable @tags.",

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
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
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

      description: "Human-readable identity resolution for Solana payments.",

      publisher: {
        "@id": "https://tagwise.me/#organization",
      },
    },

    {
      "@type": "Organization",
      "@id": "https://tagwise.me/#organization",

      name: "Tagwise Identity Protocol",
      url: "https://tagwise.me",

      logo: {
        "@type": "ImageObject",
        url: "https://tagwise.me/logo.png",
      },

      sameAs: [LINKS.GITHUB, LINKS.TWITTER, LINKS.DOCS, LINKS.NPM],
    },

    {
      "@type": "SoftwareApplication",
      "@id": "https://tagwise.me/#sdk",

      name: "Tagwise Identity Protocol SDK",

      applicationCategory: "DeveloperApplication",

      url: LINKS.NPM,

      description:
        "Open-source SDK for integrating human-readable identity resolution into Solana applications.",

      operatingSystem: "Any",

      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },

      sourceOrganization: {
        "@id": "https://tagwise.me/#organization",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col selection:bg-teal/30 selection:text-foreground">
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
