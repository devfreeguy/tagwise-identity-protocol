"use client";

import { useEffect, useState } from "react";
import { IconBrandGithub, IconBrandX, IconBrandNpm, IconExternalLink, IconSun, IconMoon } from "@tabler/icons-react";
import { Button } from "@heroui/react";
import { useTheme } from "next-themes";
import { Logo } from "../ui/logo";
import { SectionWrapper } from "./SectionWrapper";
import { NETWORK_NAME, LINKS } from "../../lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isDark = theme === "dark";

  const footerColumns = [
    {
      title: "Protocol",
      links: [
        { label: "Documentation", href: LINKS.DOCS, external: true },
        { label: "API Reference", href: LINKS.API_DOCS, external: true },
        { label: "Whitepaper", href: "/whitepaper" },
        { label: "Brand Assets", href: "/brand" },
        { label: "Security Policy", href: "/security" },
      ],
    },
    {
      title: "Ecosystem",
      links: [
        { label: "GitHub", href: LINKS.GITHUB, external: true },
        { label: "npm Package", href: LINKS.NPM, external: true },
        { label: "X (Twitter)", href: LINKS.TWITTER, external: true },
        { label: "License", href: `${LINKS.GITHUB}/blob/main/LICENSE`, external: true },
      ],
    },
    {
      title: "Legal & Support",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Cookie Policy", href: "/cookies" },
        { label: "Contact", href: LINKS.CONTACT_MAILTO },
      ],
    },
  ];

  return (
    <footer className="border-t border-border/80 bg-background relative overflow-hidden">
      {/* Subtle purple background glow */}
      {/* <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-200 h-75 bg-[#7928CA]/5 rounded-full blur-[140px] pointer-events-none" /> */}

      <SectionWrapper className="py-16 sm:py-24 relative z-10">
        
        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-border/80 border border-border/80 shadow-sm rounded-2xl overflow-hidden">
          
          {/* Brand & Mission */}
          <div className="md:col-span-5 bg-background p-8 sm:p-10 flex flex-col justify-between group">
            <div className="space-y-6">
              <Logo showName={true} size="md" />
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm font-medium">
                The foundational identity layer for payments on Solana. Enabling human-readable @tags, verifiable identity proofs, and universal resolver infrastructure.
              </p>
            </div>
            
            <div className="flex items-center gap-3 pt-12">
              <Button
                isIconOnly
                variant="outline"
                render={({ ref, ...props }: any) => <a {...props} href={LINKS.GITHUB} target="_blank" rel="noopener noreferrer" aria-label="GitHub" />}
                className="w-11 h-11 bg-surface-secondary border-border/80 text-muted-foreground hover:bg-linear-to-br hover:from-[#7928CA] hover:to-[#9F55FF] hover:border-transparent hover:text-white transition-all duration-300"
              >
                <IconBrandGithub size={18} />
              </Button>
              <Button
                isIconOnly
                variant="outline"
                render={({ ref, ...props }: any) => <a {...props} href={LINKS.TWITTER} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" />}
                className="w-11 h-11 bg-surface-secondary border-border/80 text-muted-foreground hover:bg-linear-to-br hover:from-[#7928CA] hover:to-[#9F55FF] hover:border-transparent hover:text-white transition-all duration-300"
              >
                <IconBrandX size={18} />
              </Button>
              <Button
                isIconOnly
                variant="outline"
                render={({ ref, ...props }: any) => <a {...props} href={LINKS.NPM} target="_blank" rel="noopener noreferrer" aria-label="npm package" />}
                className="w-11 h-11 bg-surface-secondary border-border/80 text-muted-foreground hover:bg-linear-to-br hover:from-[#7928CA] hover:to-[#9F55FF] hover:border-transparent hover:text-white transition-all duration-300"
              >
                <IconBrandNpm size={18} />
              </Button>
            </div>
          </div>

          {/* Links Columns Grid */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-px bg-border/80">
            {footerColumns.map((col) => (
              <div key={col.title} className="bg-background p-8 sm:p-10">
                <h4 className="text-[11px] font-mono font-bold tracking-widest text-foreground uppercase mb-6">
                  {col.title}
                </h4>
                <ul className="space-y-4">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline decoration-[#9F55FF]/50 underline-offset-4 transition-all inline-flex items-center gap-1.5 group"
                      >
                        {link.label}
                        {link.external && (
                          <IconExternalLink
                            size={14}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9F55FF]"
                          />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-border/80 bg-surface-secondary rounded-2xl overflow-hidden">
          <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            © {currentYear} Tagwise Protocol.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono uppercase tracking-widest">
            <span className="flex items-center gap-2 text-emerald-400 bg-background border border-border/80 px-2.5 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400" />
              {NETWORK_NAME} Ready
            </span>
            
            <span className="text-muted-foreground px-2.5 py-1.5 hidden sm:block">
              Open-Source Infrastructure
            </span>

            <Button
              isIconOnly
              variant="tertiary"
              onPress={toggleTheme}
              aria-label="Toggle dark mode"
              className="w-8 h-8 min-w-8 text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border/80 transition-all rounded-full"
            >
              {mounted && (isDark ? <IconSun size={14} /> : <IconMoon size={14} />)}
            </Button>
          </div>
        </div>

      </SectionWrapper>
    </footer>
  );
}
