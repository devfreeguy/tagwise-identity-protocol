"use client";

import React from "react";
import { BentoCard } from "../ui/BentoCard";
import { SectionWrapper } from "../layout/SectionWrapper";

export function ProblemSection() {
  const problems = [
    {
      id: "01",
      title: "Random Addresses",
      desc: "Humans weren't meant to remember wallet addresses.",
    },
    {
      id: "02",
      title: "Constant Verification",
      desc: "Every payment becomes a manual security check.",
    },
    {
      id: "03",
      title: "Fear of Mistakes",
      desc: "One typo can send funds somewhere else forever.",
    },
    {
      id: "04",
      title: "Broken Payment Flow",
      desc: "Asking for, copying, and pasting addresses interrupts every transaction.",
    },
  ];

  const solutions = [
    { id: "01", title: "Human @tags", desc: "Pay people, not wallet addresses." },
    { id: "02", title: "Verified Identity", desc: "Know exactly who you're paying before you send." },
    {
      id: "03",
      title: "One-Tap Payments",
      desc: "No copying, pasting, or manual verification.",
    },
    {
      id: "04",
      title: "Confidence Built In",
      desc: "Every payment is simple, familiar, and secure.",
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
          <div className="grid grid-cols-1 sm:grid-cols-2 bg-border/80 gap-px">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 bg-border/80 gap-px order-2 lg:order-1">
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
