"use client";

import * as React from "react";
import {
  Button as HeroUIButton,
  type ButtonProps as HeroUIButtonProps,
} from "@heroui/react";
import { tv, type VariantProps } from "tailwind-variants";

export const buttonStyles = tv({
  base: "font-mono font-semibold uppercase tracking-widest text-[11px] px-8 py-3.5 h-auto transition-all duration-300 rounded-full",
  variants: {
    variant: {
      primary:
        "bg-foreground text-background hover:bg-foreground/90 border-transparent",
      secondary:
        "bg-surface hover:bg-surface-secondary text-foreground border-transparent",
      tertiary:
        "border border-border/80 dark:border-white/20 hover:border-foreground/40 bg-surface/40 dark:bg-white/5 hover:bg-surface dark:hover:bg-white/10 text-foreground",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

export interface ButtonProps
  extends
    Omit<HeroUIButtonProps, "variant" | "className">,
    VariantProps<typeof buttonStyles> {
  className?: string;
  as?: React.ElementType | string;
  href?: string;
  target?: string;
  rel?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <HeroUIButton
        ref={ref}
        className={buttonStyles({ variant, class: className })}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
