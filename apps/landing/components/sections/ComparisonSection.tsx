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
    <section className="py-24 relative">
      <SectionWrapper>
        
        {/* Header */}
        <div className="mb-12">
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#8B98C2] mb-4">
            Architecture Comparison
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            TIP vs. SNS
          </h2>
        </div>

        {/* Bento Grid Comparison */}
        <div className="flex flex-col border border-border/80 bg-border/80 gap-px w-full shadow-sm rounded-2xl overflow-hidden">
          {/* Grid Header (Desktop) */}
          <div className="hidden md:grid grid-cols-3 gap-px bg-border/80">
            <div className="bg-surface-secondary p-4 sm:p-5 flex items-center">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Dimension</span>
            </div>
            <div className="group/head bg-background p-4 sm:p-5 flex items-center gap-2 relative overflow-hidden transition-all duration-300 hover:bg-linear-to-br hover:from-[#7928CA] hover:to-[#9F55FF]">
              <div className="w-1.5 h-1.5 bg-[#9F55FF] group-hover/head:bg-white transition-colors relative z-10" />
              <span className="text-sm font-bold text-foreground group-hover/head:text-white transition-colors relative z-10">
                Tagwise Protocol (TIP)
              </span>
            </div>
            <div className="bg-surface-secondary p-4 sm:p-5 flex items-center">
              <span className="text-sm font-semibold text-muted-foreground">Solana Name Service</span>
            </div>
          </div>

          {/* Grid Rows */}
          {comparisonData.map((row) => (
            <div key={row.feature} className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/80">
              
              {/* Feature Name */}
              <div className="bg-surface-secondary p-4 sm:p-5 flex flex-col justify-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground md:hidden mb-2">Dimension</span>
                <span className="text-sm font-medium text-foreground">{row.feature}</span>
              </div>
              
              {/* TIP Column */}
              <div className="group/cell bg-background hover:bg-linear-to-br hover:from-[#7928CA] hover:to-[#9F55FF] p-4 sm:p-5 transition-all duration-300 flex flex-col justify-center relative z-10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#9F55FF] group-hover/cell:text-white/80 transition-colors md:hidden mb-2">Tagwise</span>
                <div className="flex items-start gap-2">
                  <IconCheck size={16} className="text-[#8B98C2] group-hover/cell:text-white mt-0.5 shrink-0 transition-colors" />
                  <span className="text-sm font-medium text-foreground group-hover/cell:text-white transition-colors">{row.tip}</span>
                </div>
              </div>

              {/* SNS Column */}
              <div className="bg-surface-secondary p-4 sm:p-5 flex flex-col justify-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground md:hidden mb-2">SNS</span>
                <span className="text-sm text-muted-foreground">{row.sns}</span>
              </div>

            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-6 flex items-start gap-3 p-4 border border-border/80 bg-surface-secondary text-xs text-muted-foreground max-w-7xl">
          <span className="text-foreground font-medium shrink-0">Note:</span>
          <p>
            TIP and SNS serve complementary layers on Solana. SNS handles general Web3 naming and profiles, while TIP is optimized exclusively for instant financial checkout and merchant routing.
          </p>
        </div>

      </SectionWrapper>
    </section>
  );
}
