import { HeroSection } from "../components/sections/HeroSection";
import { ProblemSection } from "../components/sections/ProblemSection";
import { HowItWorksSection } from "../components/sections/HowItWorksSection";
import { BuiltForSection } from "../components/sections/BuiltForSection";
import { FinalCtaSection } from "../components/sections/FinalCtaSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <BuiltForSection />
      <FinalCtaSection />
    </>
  );
}
