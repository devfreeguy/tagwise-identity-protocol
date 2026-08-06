"use client";

import React from "react";
import { BentoCard } from "../ui/BentoCard";
import { SectionWrapper } from "../layout/SectionWrapper";

export function ProblemSection() {
  const problems = [
    {
      id: "01",
      title: "Hexadecimal Strings",
      desc: "Long, unreadable addresses.",
    },
    {
      id: "02",
      title: "Copy & Paste",
      desc: "Manual transfer breaks context.",
    },
    { id: "03", title: "Visual Checks", desc: "Verifying first/last 4 chars." },
    {
      id: "04",
      title: "Irreversible Anxiety",
      desc: "Hitting send and hoping.",
    },
  ];

  const solutions = [
    { id: "01", title: "Human @tags", desc: "Memorable Web2-like handles." },
    { id: "02", title: "Seamless UX", desc: "Integrated checkout flows." },
    {
      id: "03",
      title: "Cryptographic Proof",
      desc: "Instant on-chain verification.",
    },
    {
      id: "04",
      title: "Absolute Confidence",
      desc: "100% certainty before sending.",
    },
  ];

  return (
    <section id="problem" className="py-20 sm:py-32 relative overflow-hidden">
      <SectionWrapper className="space-y-12 sm:space-y-16">
        {/* THE PROBLEM SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 bg-border/80 border border-border gap-px rounded-2xl overflow-hidden">
          {/* Left Large Cell */}
          <div className="bg-surface min-h-60 sm:min-h-80 lg:min-h-125 p-6 sm:p-8 lg:p-12 flex flex-col justify-end items-start text-left ambient ambient-rose ambient-bottom">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-none">
              The Problem
            </h2>
          </div>

          {/* Right 2x2 Grid */}
          <div className="grid grid-cols-2 bg-border/80 gap-px">
            {problems.map((p) => (
              <BentoCard
                key={p.id}
                label={`Problem ${p.id}`}
                title={p.title}
                description={p.desc}
              />
            ))}
          </div>
        </div>

        {/* THE SOLUTION SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 bg-border/80 border border-border gap-px rounded-2xl overflow-hidden">
          {/* Left 2x2 Grid (Moved to bottom on mobile, left on desktop) */}
          <div className="grid grid-cols-2 bg-border/80 gap-px order-2 lg:order-1">
            {solutions.map((s) => (
              <BentoCard
                key={s.id}
                label={`Solution ${s.id}`}
                title={s.title}
                description={s.desc}
              />
            ))}
          </div>

          {/* Right Large Cell */}
          <div className="bg-surface min-h-60 sm:min-h-80 lg:min-h-125 p-6 sm:p-8 lg:p-12 flex flex-col justify-end items-start text-left lg:items-end lg:text-right order-1 lg:order-2 ambient ambient-ocean ambient-bottom">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-none">
              The Solution
            </h2>
          </div>
        </div>
      </SectionWrapper>
    </section>
  );
}
