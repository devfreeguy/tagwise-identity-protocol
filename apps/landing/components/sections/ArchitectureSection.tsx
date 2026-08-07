"use client";

import React from "react";
import { SectionWrapper } from "../layout/SectionWrapper";
import {
  IconApps,
  IconPackage,
  IconServer,
  IconCpu,
  IconDatabaseImport,
  IconDatabase,
  IconBolt,
} from "@tabler/icons-react";
import { NETWORK_NAME } from "../../lib/constants";
import { cn } from "@heroui/styles";

export function ArchitectureSection() {
  const layers = [
    {
      id: "apps",
      name: "Applications Layer",
      icon: IconApps,
      tag: "CONSUMER UX",
      desc: "Wallets (Phantom, Solflare), dApps, DEXs, and widgets requesting resolution.",
      detail: "Zero-dependency web & native support",
    },
    {
      id: "sdk",
      name: "TIP Client SDK",
      icon: IconPackage,
      tag: "npm: @tagwise/tip-sdk",
      desc: "Lightweight TypeScript library with local response caching and fallback RPC logic.",
      detail: "1-line async resolution",
    },
    {
      id: "api",
      name: "TIP Edge API",
      icon: IconServer,
      tag: "EDGE GATEWAY",
      desc: "High-concurrency globally distributed edge workers providing REST & GraphQL.",
      detail: "Sub-50ms caching & DDoS protection",
    },
    {
      id: "resolver",
      name: "Resolver Core",
      icon: IconCpu,
      tag: "PROTOCOL ENGINE",
      desc: "Cryptographic proof engine that verifies Anchor state signatures and proofs.",
      detail: "100% cryptographic integrity",
    },
    {
      id: "indexer",
      name: "TIP Indexer",
      icon: IconDatabaseImport,
      tag: "REAL-TIME SYNC",
      desc: "Event-driven indexer tracking on-chain Anchor account mutations and delegations.",
      detail: "Instant reverse lookups",
    },
    {
      id: "registry",
      name: "TIP Registry Program",
      icon: IconDatabase,
      tag: "ANCHOR SMART CONTRACT",
      desc: "On-chain smart contract maintaining canonical tag-to-address bindings.",
      detail: `Immutable ${NETWORK_NAME} program`,
    },
    {
      id: "solana",
      name: `Solana ${NETWORK_NAME}`,
      icon: IconBolt,
      tag: "LAYER 1 STATE",
      desc: "The base settlement layer providing sub-second finality and cryptographic consensus.",
      detail: "High throughput, minimal fees",
    },
  ];

  return (
    <section
      id="architecture"
      className="py-20 sm:py-32 relative overflow-hidden"
    >
      <SectionWrapper className="space-y-12 sm:space-y-16">
        {/* Sharp 1px Grid Vertical Stack */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 bg-border/80 border border-border/80 gap-px rounded-2xl overflow-hidden">
          {layers.map((layer, i) => {
            const Icon = layer.icon;
            return (
              <div
                key={layer.id}
                className={cn(
                  "group flex flex-col gap-6 bg-surface hover:bg-linear-to-br hover:from-[#7928CA] hover:to-[#9F55FF] p-6 sm:p-16 transition-all duration-300 relative overflow-hidden cursor-default",
                  i == 0 ? "md:col-span-2" : "",
                )}
              >
                <div className="flex gap-5 sm:gap-6 relative z-10">
                  <div className="shrink-0 flex items-center justify-center w-12 h-12 bg-surface group-hover:bg-white/10 border border-border/80 group-hover:border-white/20 text-muted-foreground group-hover:text-white transition-all duration-300">
                    <Icon size={24} stroke={1.5} />
                  </div>
                  <div>
                    <div className="w-full flex flex-col gap-1 sm:gap-3 mb-1.5">
                      <h3 className="font-medium text-lg sm:text-xl text-foreground group-hover:text-white tracking-tight transition-colors duration-300">
                        {layer.name}
                      </h3>
                      <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#8B98C2] group-hover:text-white/70 uppercase transition-colors duration-300">
                        {layer.tag}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground group-hover:text-white/90 leading-relaxed transition-colors duration-300 max-w-lg">
                      {layer.desc}
                    </p>
                  </div>
                </div>

                {/* <div className="sm:text-right shrink-0 relative z-10 pt-4 sm:pt-0 border-t border-border/40 sm:border-t-0 group-hover:border-white/20 transition-colors duration-300">
                  <span className="text-xs font-mono text-[#7928CA] group-hover:text-white/80 font-medium block transition-colors duration-300">
                    {layer.detail}
                  </span>
                </div> */}
              </div>
            );
          })}
        </div>

        {/* Architecture security note */}
        <div className="max-w-7xl mx-auto text-center p-6 bg-surface-secondary border border-border">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">
              Zero-Custody Guarantee:
            </span>{" "}
            At no point in the 7-layer stack does Tagwise hold, custody, or
            intercept payment funds.
          </p>
        </div>
      </SectionWrapper>
    </section>
  );
}
