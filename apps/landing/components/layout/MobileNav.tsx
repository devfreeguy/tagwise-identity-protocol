"use client";

import React from "react";
import { Button } from "../ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { IconBrandGithub } from "@tabler/icons-react";
import { NAV_LINKS } from "./nav-data";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LINKS } from "../../lib/constants";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden fixed top-20 left-4 right-4 bg-background/95 dark:bg-[#0f1017]/95 backdrop-blur-2xl border border-border/80 dark:border-white/10 p-5 shadow-2xl shadow-black/60 z-50 space-y-3 max-h-[75vh] overflow-y-auto rounded-2xl"
        >
          <nav className="flex flex-col space-y-2">
            {NAV_LINKS.map((link) => {
              if (link.isGroup && link.group) {
                return (
                  <div key={link.label} className="border-b border-border/40 pb-2 last:border-none space-y-1">
                    <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-[#8B98C2]">
                      {link.label}
                    </div>
                    {link.group.items.map((item) => {
                      const isActive = pathname === item.href;
                      return item.external ? (
                        <a
                          key={item.title}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={onClose}
                          className="w-full flex items-center justify-between pl-5 pr-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-surface-secondary/50 transition-colors"
                        >
                          <span>{item.title}</span>
                        </a>
                      ) : (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={onClose}
                          className={`w-full flex items-center justify-between pl-5 pr-3 py-2 text-sm font-semibold hover:bg-surface-secondary/50 transition-colors ${
                            isActive ? "text-[#A862FF] dark:text-[#C48FFF]" : "text-foreground"
                          }`}
                        >
                          <span>{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              }

              const isActive = link.href ? pathname === link.href : false;
              return (
                <div
                  key={link.label}
                  className="border-b border-border/40 pb-2 last:border-none"
                >
                  {link.external ? (
                    <a
                      href={link.href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onClose}
                      className="w-full flex items-center justify-between px-3 py-2 text-base font-semibold text-muted-foreground hover:bg-surface-secondary/50 transition-colors"
                    >
                      <span>{link.label}</span>
                    </a>
                  ) : (
                    <Link
                      href={link.href!}
                      onClick={onClose}
                      className={`w-full flex items-center justify-between px-3 py-2 text-base font-semibold hover:bg-surface-secondary/50 transition-colors ${
                        isActive ? "text-[#A862FF] dark:text-[#C48FFF]" : "text-foreground"
                      }`}
                    >
                      <span>{link.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-border/60 flex items-center justify-between">
            <a
              href={LINKS.GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <IconBrandGithub size={18} />
              GitHub
            </a>
            <Button
              as="a"
              href="#start-building"
              onClick={onClose}
              variant="primary"
            >
              Start Building
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
