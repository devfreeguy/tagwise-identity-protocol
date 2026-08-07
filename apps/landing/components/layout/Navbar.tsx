"use client";

import { useEffect, useState, useRef } from "react";
import { IconMenu2, IconX, IconChevronDown } from "@tabler/icons-react";
import { Logo } from "../ui/logo";
import { NAV_LINKS, type NavGroup } from "./nav-data";
import { MobileNav } from "./MobileNav";
import { NavPopover } from "./NavPopover";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/Button";
import { useThemeColors } from "@/hooks/useThemeColors";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<NavGroup | null>(null);

  const navRef = useRef<HTMLDivElement>(null);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const { foreground } = useThemeColors();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseEnter = (group?: NavGroup) => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    if (group) setActiveGroup(group);
  };

  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => setActiveGroup(null), 150);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-500 pt-3">
      <div
        ref={navRef}
        className={`relative transition-all duration-500 flex items-center justify-between ${
          isScrolled
            ? "w-9/10 max-w-6xl px-3 py-2 bg-background/90 dark:bg-[#0d0e14]/90 backdrop-blur-2xl border border-border/80 dark:border-white/10 gap-4 sm:gap-6 rounded-full"
            : "w-full px-4 sm:px-6 py-3 bg-transparent max-w-7xl"
        }`}
      >
        {/* Brand Logo - shows Name in Default, only Icon in On-Scroll */}
        <Logo size="md" className="ml-2" />

        {/* Desktop Navigation */}
        <nav
          className={`hidden md:flex items-center transition-all duration-500 ${
            isScrolled
              ? "bg-transparent gap-1"
              : "bg-surface/60 dark:bg-[#13141c]/80 backdrop-blur-xl border border-border/60 dark:border-white/10 p-1 gap-1 rounded-full"
          }`}
        >
          {NAV_LINKS.map((link) => {
            const isActive = link.href ? pathname === link.href : false;
            const isGroupActive =
              link.group && activeGroup?.label === link.group.label;

            return (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => handleMouseEnter(link.group)}
                onMouseLeave={handleMouseLeave}
              >
                {link.isGroup ? (
                  <button
                    className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium transition-all rounded-full ${
                      isGroupActive
                        ? "text-foreground bg-surface/80 dark:bg-white/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface/80 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{link.label}</span>
                    <IconChevronDown
                      size={14}
                      className={`transition-transform duration-300 ${isGroupActive ? "rotate-180" : ""}`}
                    />
                  </button>
                ) : link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-surface/80 dark:hover:bg-white/5 rounded-full`}
                  >
                    <span>{link.label}</span>
                  </a>
                ) : (
                  <Link
                    href={link.href!}
                    className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium transition-all rounded-full ${
                      isActive
                        ? "text-[#A862FF] dark:text-[#C48FFF] bg-[#7928CA]/15"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface/80 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{link.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right CTA Button (Matching Wireframe 1 exactly) */}
        <div className="hidden md:flex items-center gap-2 sm:gap-3 shrink-0">
          <Button as="a" href="#start-building" variant="primary">
            Start Building
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          <Button
            isIconOnly
            variant="tertiary"
            onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="text-muted-foreground hover:text-foreground"
          >
            {mobileMenuOpen ? (
              <IconX color={foreground} size={22} />
            ) : (
              <IconMenu2 color={foreground} size={22} />
            )}
          </Button>
        </div>
      </div>

      {/* Desktop Nav Popover */}
      <NavPopover
        group={activeGroup}
        onClose={() => setActiveGroup(null)}
        onMouseEnter={() => handleMouseEnter(activeGroup || undefined)}
        onMouseLeave={handleMouseLeave}
      />

      {/* Mobile Menu Dropdown */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </header>
  );
}
