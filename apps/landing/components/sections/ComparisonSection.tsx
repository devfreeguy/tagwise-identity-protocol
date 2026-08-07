"use client";

import React from "react";
import { SectionWrapper } from "../layout/SectionWrapper";
import { IconCheck } from "@tabler/icons-react";

export function ComparisonSection() {
  const comparisonData = [
    {
      feature: "Primary Design Goal",
      tip: "Payment identity & commerce routing",
      sns: "General Web3 domain naming (.sol)",
    },
    {
      feature: "Target Use Case",
      tip: "Wallets, Exchanges, Merchant Checkout",
      sns: "Web3 profile pages, NFT domains",
    },
    {
      feature: "Human-Readable Format",
      tip: "@tag (e.g. @alice)",
      sns: "domain.sol (e.g. alice.sol)",
    },
    {
      feature: "Merchant Invoices",
      tip: "Native invoice schema & verification",
      sns: "Standard text records (manual)",
    },
    {
      feature: "Token Routing",
      tip: "Native preference (SOL, USDC, PYUSD)",
      sns: "Not natively optimized for multi-token",
    },
    {
      feature: "Resolver Latency",
      tip: "< 50ms via global edge cache",
      sns: "Standard RPC latency (~200ms+)",
    },
  ];

  return (
    <section className="py-20 sm:py-32 relative overflow-hidden">
      <SectionWrapper className="space-y-12 sm:space-y-16">
        {/* Header */}
        <div>
          <p className="text-sm font-semibold text-[#8B98C2] tracking-wide uppercase mb-3">
            Architecture Comparison
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-none">
            TIP vs. SNS
          </h2>
        </div>

        {/* Scrollable Table Container */}
        <div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
          <div className="min-w-200 grid grid-cols-3 gap-px bg-border/80 border border-border/80 rounded-2xl overflow-hidden">
            {/* Grid Header */}
            <div className="bg-surface p-8 flex items-center">
              <span className="text-xs font-mono uppercase tracking-widest text-[#8B98C2]">Dimension</span>
            </div>
            <div className="bg-background p-8 flex items-center gap-2.5 transition-all duration-300 hover:bg-linear-to-br hover:from-[#7928CA] hover:to-[#9F55FF] group/head">
              <div className="w-1.5 h-1.5 rounded-full bg-[#9F55FF] group-hover/head:bg-white transition-colors duration-300" />
              <span className="text-sm font-semibold text-foreground group-hover/head:text-white transition-colors duration-300">
                Tagwise Protocol (TIP)
              </span>
            </div>
            <div className="bg-surface p-8 flex items-center">
              <span className="text-sm font-semibold text-muted-foreground">Solana Name Service (SNS)</span>
            </div>

            {/* Grid Rows */}
            {comparisonData.map((row) => (
              <React.Fragment key={row.feature}>
                {/* Feature Name */}
                <div className="bg-surface p-8 flex flex-col justify-center">
                  <span className="text-base font-medium text-foreground">{row.feature}</span>
                </div>
                
                {/* TIP Column */}
                <div className="bg-background hover:bg-linear-to-br hover:from-[#7928CA] hover:to-[#9F55FF] p-8 transition-all duration-300 flex flex-col justify-center group/cell">
                  <div className="flex items-start gap-2.5">
                    <IconCheck size={18} className="text-[#9F55FF] group-hover/cell:text-white mt-1 shrink-0 transition-colors duration-300" />
                    <span className="text-base font-medium text-foreground group-hover/cell:text-white transition-colors duration-300">{row.tip}</span>
                  </div>
                </div>

                {/* SNS Column */}
                <div className="bg-surface p-8 flex flex-col justify-center">
                  <span className="text-base text-muted-foreground leading-relaxed">{row.sns}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-8 border border-border/80 bg-surface rounded-2xl text-sm sm:text-base text-muted-foreground max-w-7xl leading-relaxed">
          <p>
            <span className="text-foreground font-semibold">Note:</span>{" "}
            TIP and SNS serve complementary layers on Solana. SNS handles general Web3 naming and profiles, while TIP is optimized exclusively for instant financial checkout and merchant routing.
          </p>
        </div>

      </SectionWrapper>
    </section>
  );
}
