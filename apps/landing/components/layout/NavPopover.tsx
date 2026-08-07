"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconArrowUpRight } from "@tabler/icons-react";
import { type NavGroup, SOCIAL_BUTTONS } from "./nav-data";

interface NavPopoverProps {
  group: NavGroup | null;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function NavPopover({
  group,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: NavPopoverProps) {
  return (
    <AnimatePresence>
      {group && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="hidden md:block absolute top-8/10 left-1/2 -translate-x-1/2 z-50 "
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div className="mt-4 w-max min-w-100 max-w-150 bg-border/80 border border-border/80 shadow-sm text-left rounded-2xl overflow-hidden">
            <div className="flex items-stretch bg-border/80 gap-px">
              {/* Main Nav Items List */}
              <div className="flex-1 flex flex-col gap-px bg-border/80">
                {group.items.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <a
                      key={item.title}
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      onClick={onClose}
                      className="flex items-start gap-4 p-5 bg-background hover:bg-surface-secondary/50 transition-colors group/item"
                    >
                      <IconComponent
                        size={20}
                        className="text-[#8B98C2] group-hover/item:text-foreground transition-colors shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <span>{item.title}</span>
                          {item.external && (
                            <IconArrowUpRight
                              size={14}
                              className="opacity-50 group-hover/item:opacity-100 transition-opacity"
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>

              {/* Right-side Social Icons Column */}
              {group.hasSocialColumn && (
                <div className="flex flex-col gap-px bg-border/80 shrink-0 w-16">
                  {SOCIAL_BUTTONS.map((social) => {
                    const SocialIcon = social.icon;
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="flex-1 bg-background hover:bg-surface-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <SocialIcon size={18} />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
