import { DeveloperExperienceSection } from "../../components/sections/DeveloperExperienceSection";
import { LivePlaygroundSection } from "../../components/sections/LivePlaygroundSection";
import { DocumentationSection } from "../../components/sections/DocumentationSection";
import { PageHero } from "../../components/ui/PageHero";
import { IconCode } from "@tabler/icons-react";

export default function Developers() {
  return (
    <div className="pb-16">
      <PageHero
        icon={IconCode}
        title="Build with Tagwise"
        description="Integrate the universal identity layer into your wallet, dApp, or service with our simple SDK and REST API."
      />

      <DeveloperExperienceSection />
      <LivePlaygroundSection />
      <DocumentationSection />
    </div>
  );
}
