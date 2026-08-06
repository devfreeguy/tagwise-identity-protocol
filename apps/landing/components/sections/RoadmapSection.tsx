"use client";

import {
  IconCheck,
  IconLoader,
  IconClock,
  IconCircleDot,
} from "@tabler/icons-react";
import { SectionWrapper } from "../layout/SectionWrapper";
import { NETWORK_NAME } from "../../lib/constants";

export function RoadmapSection() {
  const phases = [
    {
      phase: "PHASE 01",
      title: "Core Infrastructure",
      status: `LIVE ON ${NETWORK_NAME.toUpperCase()}`,
      statusColor: "emerald" as const,
      icon: IconCheck,
      description:
        "Foundational Anchor smart contracts and edge resolver network.",
      items: [
        "Anchor Identity Registry Program deployment",
        "Globally distributed Edge Resolver API",
        "@tagwise/tip-sdk TypeScript client release",
        "Comprehensive documentation & API reference",
      ],
    },
    {
      phase: "PHASE 02",
      title: "Ecosystem Expansion",
      status: "IN PROGRESS",
      statusColor: "purple" as const,
      icon: IconLoader,
      description:
        "Wallet integrations, commerce rails, and native checkout tooling.",
      items: [
        "Native Wallet Adapter plugins & badges",
        "Solana Pay QR code tag resolution",
        "Merchant Checkout URL generator SDK",
        "Multi-token settlement routing preferences",
      ],
    },
    {
      phase: "PHASE 03",
      title: "Decentralized Indexing & DAO",
      status: "PLANNED",
      statusColor: "amber" as const,
      icon: IconClock,
      description:
        "Permissionless validator indexing and community governance.",
      items: [
        "Decentralized Indexer node operator network",
        "Protocol parameter governance via TIP DAO",
        "Cross-chain identity resolution bridges",
        "Zero-knowledge compliance & selective disclosure",
      ],
    },
  ];

  return (
    <section id="roadmap" className="py-16 relative">
      <SectionWrapper>
        {/* 3-Column Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/80 border border-border/80 shadow-sm rounded-2xl overflow-hidden">
          {phases.map((phase) => {
            const Icon = phase.icon;
            const isLive = phase.statusColor === "emerald";
            const isInProgress = phase.statusColor === "purple";

            return (
              <div
                key={phase.phase}
                className="bg-background flex flex-col justify-between relative overflow-hidden group hover:bg-surface-secondary/50 transition-colors duration-300"
              >
                {/* Top Accent Line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    isLive
                      ? "bg-emerald-500"
                      : isInProgress
                        ? "bg-[#9F55FF]"
                        : "bg-border/80"
                  }`}
                />

                <div className="p-8 sm:p-10 space-y-8 flex-1 flex flex-col">
                  {/* Phase header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#8B98C2]">
                      {phase.phase}
                    </span>
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest border ${
                        isLive
                          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                          : isInProgress
                            ? "text-[#9F55FF] border-[#7928CA]/30 bg-[#7928CA]/5"
                            : "text-muted-foreground border-border/80 bg-background"
                      }`}
                    >
                      <Icon
                        size={12}
                        className={isInProgress ? "animate-spin" : ""}
                      />
                      <span>{phase.status}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-2xl font-semibold text-foreground">
                      {phase.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {phase.description}
                    </p>
                  </div>

                  {/* Checklist items */}
                  <div className="pt-6 border-t border-border/60 flex-1">
                    <ul className="space-y-4">
                      {phase.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-[13px]"
                        >
                          {isLive ? (
                            <IconCheck
                              size={16}
                              className="text-emerald-400 shrink-0 mt-0.5"
                            />
                          ) : isInProgress ? (
                            <IconCircleDot
                              size={16}
                              className="text-[#9F55FF] shrink-0 mt-0.5"
                            />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0 mt-1.5 ml-1" />
                          )}
                          <span
                            className={
                              isLive
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionWrapper>
    </section>
  );
}
