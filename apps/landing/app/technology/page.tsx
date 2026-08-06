import { ArchitectureSection } from "../../components/sections/ArchitectureSection";
import { ComparisonSection } from "../../components/sections/ComparisonSection";
import { ProtocolFlowAnimation } from "../../components/sections/technology/ProtocolFlowAnimation";
import { PageHero } from "../../components/ui/PageHero";
import { IconNetwork } from "@tabler/icons-react";

export default function Technology() {
  return (
    <div className="pb-16">
      <PageHero
        icon={IconNetwork}
        title="Inside the Protocol"
        description="A deep dive into the decentralized architecture, cryptographic identity resolution, and high-performance infrastructure that powers Tagwise."
      />
      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <ProtocolFlowAnimation />
      </section>

      <ArchitectureSection />
      <ComparisonSection />
    </div>
  );
}
