"use client";

import * as React from "react";
import {
  Button as HeroUIButton,
  type ButtonProps as HeroUIButtonProps,
} from "@heroui/react";
import { tv, type VariantProps } from "tailwind-variants";

export const buttonStyles = tv({
  base: "font-mono font-semibold uppercase tracking-widest transition-all duration-300 rounded-full",
  variants: {
    variant: {
      primary: "bg-foreground text-background hover:bg-foreground/90 border-transparent",
      secondary: "bg-surface hover:bg-surface-secondary text-foreground border-transparent",
      tertiary: "border border-border/80 dark:border-white/20 hover:border-foreground/40 bg-surface/40 dark:bg-white/5 hover:bg-surface dark:hover:bg-white/10 text-foreground",
    },
    size: {
      sm: "px-6 py-2.5 h-auto text-[10px]",
      md: "px-8 py-3.5 h-auto text-[11px]",
      lg: "px-10 py-4 h-auto text-[12px]",
    },
    isIconOnly: {
      true: "!px-0 !py-0 aspect-square",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
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
  ({ className, variant, size = "md", isIconOnly, ...props }, ref) => {
    return (
      <HeroUIButton
        ref={ref}
        size={size as HeroUIButtonProps["size"]}
        isIconOnly={isIconOnly}
        className={buttonStyles({ variant, size, isIconOnly, class: className })}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
