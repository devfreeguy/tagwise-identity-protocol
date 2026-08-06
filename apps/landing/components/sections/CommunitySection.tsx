"use client";

import {
  IconBrandGithub,
  IconBrandX,
  IconMessageCircle,
  IconUsers,
  IconArrowRight,
} from "@tabler/icons-react";
import { SectionWrapper } from "../layout/SectionWrapper";
import { Button } from "../ui/Button";
import { NETWORK_NAME, LINKS } from "../../lib/constants";

export function CommunitySection() {
  const channels = [
    {
      title: "GitHub Repository",
      icon: IconBrandGithub,
      desc: "Star our repository, submit pull requests, or review our open Anchor registry smart contracts.",
      href: LINKS.GITHUB,
      linkText: "View GitHub",
    },
    {
      title: "X (Twitter)",
      icon: IconBrandX,
      desc: `Follow @tagwiseme for ${NETWORK_NAME.toLowerCase()} updates, ecosystem partner integrations, and protocol upgrades.`,
      href: LINKS.TWITTER,
      linkText: "Follow @tagwiseme",
    },
    {
      title: "Developer Community",
      icon: IconMessageCircle,
      desc: "Connect with TIP core engineers, ask SDK integration questions, and discuss RFC proposals.",
      href: `${LINKS.GITHUB}/discussions`,
      linkText: "Join Discussions",
    },
    {
      title: "Partner Program",
      icon: IconUsers,
      desc: "Integrating TIP into an exchange, wallet, or payment gateway? Get direct engineering support.",
      href: LINKS.CONTACT_MAILTO,
      linkText: "Contact Core Team",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden ambient ambient-focus ambient-bottom">
      <SectionWrapper className="space-y-16 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Join the Protocol Community
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Tagwise is an open protocol built for and governed by the Solana
            builder community. Get involved, contribute code, or partner with
            us.
          </p>
        </div>

        {/* Community Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-surface border border-border/80 shadow-sm max-w-7xl mx-auto rounded-2xl overflow-hidden">
          {channels.map((chan) => {
            const Icon = chan.icon;
            return (
              <a
                key={chan.title}
                href={chan.href}
                target={chan.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  chan.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="group bg-background/50 hover:bg-linear-to-br hover:from-[#7928CA] hover:to-[#9F55FF] p-8 sm:p-10 space-y-8 flex flex-col justify-between transition-all duration-300 min-h-75"
              >
                <div className="space-y-6 relative z-10">
                  <Icon
                    size={28}
                    className="text-[#8B98C2] group-hover:text-white transition-colors"
                  />

                  <div>
                    <h3 className="text-2xl font-semibold text-foreground group-hover:text-white transition-colors">
                      {chan.title}
                    </h3>
                    <p className="text-sm text-muted-foreground group-hover:text-white/90 mt-3 leading-relaxed transition-colors">
                      {chan.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-widest text-[#9F55FF] group-hover:text-white transition-colors relative z-10">
                  <Button variant="tertiary" size="sm" className="group-hover:text-white hover:bg-white/20 hover:border-white/40">
                    {chan.linkText}
                    <IconArrowRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </Button>
                </div>
              </a>
            );
          })}
        </div>
      </SectionWrapper>
    </section>
  );
}
