"use client";

import React from "react";

interface BentoCardProps {
  label: string;
  title: string;
  description: string;
  labelColor?: string;
}

export function BentoCard({ label, title, description, labelColor = "text-[#8B98C2]" }: BentoCardProps) {
  return (
    <div className="bg-background hover:bg-linear-to-br hover:from-[#7928CA] hover:to-[#9F55FF] p-6 lg:p-8 flex flex-col items-start min-h-50 lg:min-h-62.5 transition-all duration-300 group cursor-default">
      {/* <h3 className={`text-[13px] font-semibold ${labelColor} group-hover:text-white/80 tracking-wide mb-6 transition-colors duration-300`}>
        {label}
      </h3> */}
      <div className="mt-auto">
        <p className="text-foreground group-hover:text-white text-xl font-medium tracking-tight transition-colors duration-300">
          {title}
        </p>
        <p className="text-muted-foreground group-hover:text-white/90 text-sm mt-1.5 transition-colors duration-300">
          {description}
        </p>
      </div>
    </div>
  );
}
