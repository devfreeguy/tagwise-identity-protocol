"use client";

import { IconArrowRight, IconBrandGithub } from "@tabler/icons-react";
import { Button } from "@heroui/react";
import { SectionWrapper } from "../layout/SectionWrapper";
import { LINKS } from "../../lib/constants";

export function FinalCtaSection() {
  return (
    <section
      id="start-building"
      className="py-20 sm:py-32 relative overflow-hidden"
    >
      <SectionWrapper>
        {/* Structural 1px Grid Container */}
        <div className="bg-border/80 border border-border/80 p-px relative overflow-hidden rounded-2xl ">
          <div className="gradient gradient-cosmic relative overflow-hidden flex flex-col items-center justify-center text-center p-12 sm:p-20 lg:p-32 space-y-8">
            <div className="relative z-10 flex flex-col items-center space-y-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-[#fcfcfe] leading-none">
                Build the Future of <br className="hidden sm:block" />
                Payment Identity.
              </h2>

              <p className="text-base sm:text-lg text-[#b1b1b4] max-w-2xl leading-relaxed font-normal">
                Stop sending your users hexadecimal strings. Give them
                memorable, cryptographically verified payment identities in less
                than 5 minutes of setup.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Button
                  render={({ ref, ...props }: any) => (
                    <a
                      {...props}
                      href={LINKS.DOCS}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  )}
                  className="group font-mono font-semibold uppercase tracking-widest text-[11px] px-8 py-4 h-auto bg-[#fcfcfe] text-[#060607] hover:bg-[#fcfcfe]/90 transition-all duration-300 rounded-full"
                >
                  <span>Read Documentation</span>
                  <IconArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform duration-300"
                  />
                </Button>

                <Button
                  render={({ ref, ...props }: any) => (
                    <a
                      {...props}
                      href={LINKS.GITHUB}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  )}
                  className="group font-mono font-semibold uppercase tracking-widest text-[11px] px-8 py-4 h-auto border border-border/80 dark:border-white/20 hover:border-[#fcfcfe]/40 bg-white/5 hover:bg-white/10 text-[#fcfcfe] transition-all duration-300 rounded-full"
                >
                  <IconBrandGithub size={16} />
                  <span>Explore SDK</span>
                </Button>
              </div>
            </div>

            {/* Bottom Tech Details */}
            {/* <div className="relative z-10 pt-10 mt-10 w-full max-w-md mx-auto flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-muted-foreground/60 font-mono border-t border-border/40">
              <span>npm i @tagwise/tip-sdk</span>
              <span className="hidden sm:inline">•</span>
              <span>Anchor Verified</span>
              <span className="hidden sm:inline">•</span>
              <span>Open Source</span>
            </div> */}
          </div>
        </div>
      </SectionWrapper>
    </section>
  );
}
