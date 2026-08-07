"use client";

import React from "react";
import { SectionWrapper } from "../layout/SectionWrapper";
import {
  IconWallet,
  IconBuildingBank,
  IconShoppingBag,
  IconCode,
} from "@tabler/icons-react";
import { Button } from "../ui/Button";
import { LINKS } from "../../lib/constants";

export function BuiltForSection() {
  const audiences = [
    {
      title: "Wallets",
      icon: IconWallet,
      headline: "Zero-Friction Crypto Payments",
      description:
        "Replace long wallet addresses with simple @tags for faster, safer crypto payments. Verify recipients instantly and eliminate costly sending mistakes.",
      linkText: "Explore Wallet SDK →",
      href: `${LINKS.DOCS}/wallets`,
    },
    {
      title: "Exchanges",
      icon: IconBuildingBank,
      headline: "Human-Friendly Withdrawals",
      description:
        "Let customers withdraw funds to @tags instead of copying wallet addresses. Reduce failed withdrawals and improve the overall user experience.",
      linkText: "Explore Exchange API →",
      href: `${LINKS.DOCS}/exchanges`,
    },
    {
      title: "Merchants",
      icon: IconShoppingBag,
      headline: "Accept Payments with @tags",
      description:
        "Create simple, memorable payment links that customers can trust. Accept crypto payments effortlessly across the Solana ecosystem.",
      linkText: "Explore Merchant Solutions →",
      href: `${LINKS.DOCS}/merchants`,
    },
    {
      title: "Developers",
      icon: IconCode,
      headline: "Integrate in Minutes",
      description:
        "Resolve @tags, verify recipients, and build seamless payment experiences using a lightweight, TypeScript-first SDK.",
      linkText: "Explore Developer Docs →",
      href: LINKS.DOCS,
    },
  ];

  return (
    <section className="py-20 sm:py-32 relative overflow-hidden">
      <SectionWrapper className="space-y-12 sm:space-y-16">
        {/* Minimal Section Header */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-center text-foreground">
          Built for the Entire Solana Economy
        </h2>

        {/* Sharp 1px Grid */}
        <div className="bg-surface grid grid-cols-1 md:grid-cols-2 border border-border/80 gap-px rounded-2xl overflow-hidden">
          {audiences.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.title}
                className="group flex flex-col bg-background/40 hover:bg-linear-to-br hover:from-[#7928CA] hover:to-[#9F55FF] p-8 sm:p-10 lg:p-14 min-h-80 transition-all duration-300 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-[#8B98C2] group-hover:text-white/80 tracking-wide uppercase transition-colors duration-300">
                    {item.title}
                  </h3>
                  <Icon
                    size={36}
                    stroke={1}
                    className="text-muted-foreground/30 group-hover:text-white/40 group-hover:scale-110 transition-all duration-500 transform origin-top-right"
                  />
                </div>

                <div className="mt-auto space-y-4 pt-12">
                  <h4 className="text-2xl lg:text-3xl font-medium tracking-tight text-foreground group-hover:text-white transition-colors duration-300">
                    {item.headline}
                  </h4>
                  <p className="text-muted-foreground group-hover:text-white/90 text-sm sm:text-base leading-relaxed transition-colors duration-300 max-w-md">
                    {item.description}
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#7928CA] group-hover:text-white transition-colors duration-300 pt-2"></div>
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    <Button variant="tertiary">{item.linkText}</Button>
                  </a>
                </div>
              </a>
            );
          })}
        </div>
      </SectionWrapper>
    </section>
  );
}
