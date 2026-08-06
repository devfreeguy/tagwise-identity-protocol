import { IconClock } from "@tabler/icons-react";
import { SectionWrapper } from "../layout/SectionWrapper";
import { Button } from "./Button";
import Link from "next/link";

interface ComingSoonProps {
  title: string;
}

export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <section className="py-32 relative min-h-[70vh] flex items-center justify-center">
      <div className="absolute inset-0 ambient ambient-focus pointer-events-none opacity-50" />
      <SectionWrapper>
        <div className="max-w-2xl mx-auto border border-border/80 bg-background shadow-sm rounded-2xl overflow-hidden text-center p-12 sm:p-16 relative z-10">
          <div className="w-16 h-16 bg-surface-secondary border border-border/80 rounded-full flex items-center justify-center mx-auto mb-8 text-[#9F55FF]">
            <IconClock size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            {title}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mb-10 max-w-md mx-auto leading-relaxed">
            We are working hard to finalize this page. Please check back later for updates.
          </p>
          <Link href="/">
            <Button variant="tertiary" as="span">
              Back to Home
            </Button>
          </Link>
        </div>
      </SectionWrapper>
    </section>
  );
}
