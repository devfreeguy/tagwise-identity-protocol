"use client";

import {
  IconBrandGithub,
  IconFolder,
  IconFileCode,
  IconCheck,
} from "@tabler/icons-react";
import { SectionWrapper } from "../layout/SectionWrapper";
import { Chip } from "@heroui/react";
import { Button } from "../ui/Button";
import { LINKS } from "../../lib/constants";

export function OpenSourceSection() {
  const packages = [
    {
      path: "programs/tip-registry",
      name: "Anchor Smart Contract",
      tag: "SOLANA PROGRAM",
      desc: "On-chain Anchor program written in Rust managing immutable @tag bindings, delegations, and ownership.",
    },
    {
      path: "packages/sdk",
      name: "@tagwise/tip-sdk",
      tag: "CLIENT LIBRARY",
      desc: "Complete TypeScript client SDK for 1-line tag resolution in dApps, wallets, and Node.js backends.",
    },
    {
      path: "apps/landing",
      name: "Protocol Website",
      tag: "NEXT.JS APP",
      desc: "The open-source landing page and live interactive playground built with Next.js 16 and HeroUI.",
    },
    {
      path: "apps/docs",
      name: "Documentation Portal",
      tag: "FUMADOCS",
      desc: "Developer guides, API specification, and integration tutorials for wallets and merchants.",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <SectionWrapper className="space-y-16 relative z-10">
        {/* Monorepo Directory Visual + Packages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border border-border/80 shadow-sm max-w-7xl mx-auto rounded-2xl overflow-hidden">
          {/* Left: Directory Tree */}
          <div className="lg:col-span-5 bg-[#0a0a0c] p-8 sm:p-10 font-mono text-xs flex flex-col justify-between min-h-100">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 text-muted">
              <span className="flex items-center gap-2">
                <IconBrandGithub size={16} />
                tagwise-identity-protocol
              </span>
              <span className="text-emerald-400">main</span>
            </div>

            <div className="space-y-2.5 text-foreground/90 leading-relaxed py-6 flex-1">
              <div className="flex items-center gap-2 text-[#9F55FF]">
                <IconFolder size={15} />
                <span>tagwise-identity-protocol/</span>
              </div>
              <div className="pl-4 space-y-2 border-l border-white/10 ml-2">
                <div className="flex items-center gap-2">
                  <IconFolder size={14} className="text-amber-400" />
                  <span>apps/</span>
                </div>
                <div className="pl-4 space-y-1.5 border-l border-white/10 ml-2 text-muted">
                  <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
                    <IconFileCode size={13} className="text-blue-400" />
                    <span>landing/ (tagwise.me)</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
                    <IconFileCode size={13} className="text-blue-400" />
                    <span>docs/ (docs.tagwise.me)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <IconFolder size={14} className="text-emerald-400" />
                  <span>packages/</span>
                </div>
                <div className="pl-4 space-y-1.5 border-l border-white/10 ml-2 text-muted">
                  <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
                    <IconFileCode size={13} className="text-purple-400" />
                    <span>sdk/ (@tagwise/tip-sdk)</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
                    <IconFileCode size={13} className="text-purple-400" />
                    <span>types/</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <IconFolder size={14} className="text-red-400" />
                  <span>programs/</span>
                </div>
                <div className="pl-4 space-y-1.5 border-l border-white/10 ml-2 text-muted">
                  <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
                    <IconFileCode size={13} className="text-orange-400" />
                    <span>tip-registry/ (Anchor Rust)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-[11px] text-muted uppercase tracking-widest">
              <span>License: MIT</span>
              <span>Turborepo + pnpm</span>
            </div>
          </div>

          {/* Right: Packages Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/80">
            {packages.map((pkg) => (
              <div
                key={pkg.path}
                className="group bg-background hover:bg-linear-to-br hover:from-[#7928CA] hover:to-[#9F55FF] p-8 space-y-6 flex flex-col transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8B98C2] group-hover:text-white transition-colors">
                    {pkg.tag}
                  </span>
                  <IconCheck
                    size={16}
                    className="text-emerald-400 group-hover:text-white transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-white transition-colors">
                    {pkg.name}
                  </h3>
                  <p className="text-sm text-muted group-hover:text-white/90 leading-relaxed transition-colors mt-3">
                    {pkg.desc}
                  </p>
                </div>
                <Chip className="font-mono">{pkg.path}</Chip>
                {/* <div className=" text-xs text-muted-foreground group-hover:text-white/80 transition-colors mb-1.5">
                </div> */}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-8">
          <a
            href={LINKS.GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            // className="inline-flex items-center justify-center gap-2 bg-[#7928CA] text-white font-mono uppercase tracking-widest text-[11px] font-semibold px-8 py-4 hover:bg-[#6820B0] transition-colors border border-[#7928CA]"
          >
            <Button size="sm">
              <IconBrandGithub size={18} />
              <span>Explore Monorepo on GitHub</span>
            </Button>
          </a>
        </div>
      </SectionWrapper>
    </section>
  );
}
