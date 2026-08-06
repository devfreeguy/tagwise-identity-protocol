import React from "react";

interface PageHeroProps {
  icon: React.ElementType;
  title: React.ReactNode;
  description: string;
}

export function PageHero({ icon: Icon, title, description }: PageHeroProps) {
  return (
    <section className="max-h-125 relative pt-32 pb-16 overflow-hidden flex flex-col items-center justify-center text-center ambient ambient-ocean ambient-bottom">
      {/* Subtle ambient lighting for premium minimalist feel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-linear-to-tr from-[#7928CA]/8 via-[#9F55FF]/5 to-transparent rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 flex flex-col items-center">
        {/* Icon Box */}
        <div className="rounded-2xl border border-border/80 bg-surface shadow-sm inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-8 sm:mb-10 text-muted-foreground transition-all duration-300 hover:text-foreground hover:scale-105 hover:border-[#7928CA]/40">
          <Icon size={32} stroke={1.5} className="sm:w-10 sm:h-10" />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-none mb-6">
          {title}
        </h1>

        {/* Description */}
        <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed font-normal">
          {description}
        </p>
      </div>
    </section>
  );
}
