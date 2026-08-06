"use client";

import {
  IconBook,
  IconWallet,
  IconBuildingBank,
  IconShoppingBag,
  IconArrowRight,
  IconExternalLink,
} from "@tabler/icons-react";
import { SectionWrapper } from "../layout/SectionWrapper";
import { LINKS } from "../../lib/constants";

export function DocumentationSection() {
  const docs = [
    {
      title: "Protocol Overview",
      icon: IconBook,
      desc: "Deep dive into the TIP architecture, Anchor smart contracts, and cryptographic verification model.",
      href: LINKS.DOCS,
    },
    {
      title: "Wallet SDK Guide",
      icon: IconWallet,
      desc: "Step-by-step guide to adding 1-line tag resolution and verified recipient badges to your Solana wallet.",
      href: `${LINKS.DOCS}/wallets`,
    },
    {
      title: "Exchange API Guide",
      icon: IconBuildingBank,
      desc: "REST & GraphQL endpoint documentation for integrating human-readable customer withdrawals.",
      href: `${LINKS.DOCS}/exchanges`,
    },
    {
      title: "Merchant Integration",
      icon: IconShoppingBag,
      desc: "Learn how to accept payments with structured invoice metadata and dynamic checkout links.",
      href: `${LINKS.DOCS}/merchants`,
    },
  ];

  return (
    <section className="py-24 relative">
      <SectionWrapper className="space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#8B98C2] mb-4">
            Developer Resources
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Documentation & Guides
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Everything you need to integrate Tagwise Identity Protocol into your Solana application, backed by runnable code examples and API schemas.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border/80 border border-border/80 shadow-sm rounded-2xl overflow-hidden">
          {docs.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-background hover:bg-linear-to-br hover:from-[#7928CA] hover:to-[#9F55FF] transition-all duration-300 p-8 flex flex-col justify-between h-full min-h-70"
              >
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <Icon size={24} className="text-[#8B98C2] group-hover:text-white transition-colors" />
                    <IconExternalLink size={16} className="text-muted-foreground group-hover:text-white/70 transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-white transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground group-hover:text-white/80 mt-3 leading-relaxed transition-colors">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-8 flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[#9F55FF] group-hover:text-white transition-colors relative z-10">
                  <span>Read Guide</span>
                  <IconArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>
      </SectionWrapper>
    </section>
  );
}
