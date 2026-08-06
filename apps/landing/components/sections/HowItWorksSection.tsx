"use client";

import { cn } from "@heroui/styles";
import React, { useState, useEffect } from "react";
import { Step1Preview } from "./how-it-works/Step1Preview";
import { Step2Preview } from "./how-it-works/Step2Preview";
import { Step3Preview } from "./how-it-works/Step3Preview";
import { Step4Preview } from "./how-it-works/Step4Preview";
import { SectionWrapper } from "../layout/SectionWrapper";

const steps = [
  {
    id: "01",
      title: "Register an Identity",
      desc: "Create a unique @tag that securely maps to your wallet and serves as your universal payment identity.",
    },
    {
      id: "02",
      title: "Resolve Any @tag",
      desc: "Resolve any @tag into its wallet address, profile, verification status, and payment metadata in milliseconds.",
    },
    {
      id: "03",
      title: "Verify & Display Identity",
      desc: "Retrieve verified identity information, including display name, avatar, merchant status, preferred payment token, payment links, and more.",
    },
    {
      id: "04",
      title: "Send with Confidence",
      desc: "Complete payments using the resolved wallet while users simply interact with recognizable @tags instead of cryptic addresses.",
    },
  ];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState<string>("01");
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveStep((prevStep) => {
        const currentIndex = steps.findIndex((s) => s.id === prevStep);
        const nextIndex = (currentIndex + 1) % steps.length;
        return steps[nextIndex]?.id || "01";
      });
    }, 4500); // 4.5s allows animation to finish

    return () => clearInterval(timer);
  }, [activeStep, isPaused]);

  return (
    <section
      id="how-it-works"
      className="py-20 sm:py-32 relative overflow-hidden"
    >
      <SectionWrapper className="space-y-12 sm:space-y-16">
        {/* Section Header */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-center text-foreground">
          How TIP Resolves Identities
        </h2>

        {/* Interactive Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 bg-border/80 border border-border/80 gap-px rounded-2xl overflow-hidden">
          {/* Left Column: Preview Area */}
          <div className="bg-surface min-h-90 lg:min-h-125 relative overflow-hidden order-1 lg:order-2 border-b border-border/80 lg:border-b-0 lg:border-l">
            <Step1Preview active={activeStep === "01"} />
            <Step2Preview active={activeStep === "02"} />
            <Step3Preview active={activeStep === "03"} />
            <Step4Preview active={activeStep === "04"} />
          </div>

          {/* Right Column: List of Steps */}
          <div 
            className="grid grid-cols-1 bg-border/80 gap-px order-2 lg:order-1"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {steps.map((step) => {
              const isActive = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={cn(
                    "w-full text-left p-6 sm:p-8 flex flex-col sm:flex-row gap-4 sm:gap-6 transition-all duration-300",
                    isActive
                      ? "bg-linear-to-br from-[#7928CA] to-[#9F55FF] cursor-default"
                      : "bg-background hover:bg-surface/50 cursor-pointer group",
                  )}
                >
                  <div className="h-[0.62em] w-36 overflow-hidden text-[80px] sm:text-[100px] lg:text-[120px] leading-none select-none shrink-0 -mt-2">
                    <span
                      className={cn(
                        "font-light tracking-tighter transition-colors duration-300 block",
                        isActive
                          ? "text-white/70"
                          : "text-muted/40 group-hover:text-muted-foreground/40",
                      )}
                    >
                      {step.id}
                    </span>
                  </div>

                  <div className="sm:mt-1">
                    <h3
                      className={cn(
                        "text-xl font-medium tracking-tight transition-colors duration-300",
                        isActive ? "text-white" : "text-foreground",
                      )}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={cn(
                        "text-sm mt-1.5 transition-colors duration-300",
                        isActive ? "text-white/90" : "text-muted-foreground",
                      )}
                    >
                      {step.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </SectionWrapper>
    </section>
  );
}
