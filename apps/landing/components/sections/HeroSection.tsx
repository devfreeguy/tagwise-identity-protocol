"use client";

import React from "react";
import { Button } from "../ui/Button";
import { LINKS } from "../../lib/constants";

export function HeroSection() {
  return (
    <section className="relative h-dvh min-h-160 flex flex-col justify-end pb-12 sm:pb-16 lg:pb-20 pt-28 overflow-hidden ambient ambient-spectrum ambient-strong ambient-grain">
      <div className="max-w-7xl mx-auto w-full px-6 sm:px-10 lg:px-12 relative z-10">
        <div className="max-w-3xl space-y-5 text-left">
          {/* Title or Heading of the landing page */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-medium tracking-tight text-foreground leading-[1.12]">
            The Identity Layer for <br className="hidden sm:inline" />
            Payments on Solana.
          </h1>

          {/* Secondary text or other write ups */}
          <p className="text-base sm:text-lg text-muted max-w-2xl leading-relaxed font-normal">
            Tagwise Identity Protocol (TIP) allows wallets, exchanges,
            merchants, and developers to resolve human-readable @tags into
            trusted payment identities.
          </p>

          {/* Action Buttons: View Docs & Read Whitepaper */}
          <div className="flex flex-wrap items-center gap-4 pt-3">
            <Button
              variant="primary"
              render={({ ref, ...props }: any) => (
                <a
                  {...props}
                  href={LINKS.DOCS}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              )}
            >
              View Docs
            </Button>

            <Button
              variant="tertiary"
              render={({ ref, ...props }: any) => (
                <a {...props} href="/whitepaper" />
              )}
            >
              Read Whitepaper
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
