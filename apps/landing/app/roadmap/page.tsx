import { RoadmapSection } from "../../components/sections/RoadmapSection";
import { PageHero } from "../../components/ui/PageHero";
import { IconRoute } from "@tabler/icons-react";

export default function Roadmap() {
  return (
    <div className="pb-16">
      <PageHero
        icon={IconRoute}
        title="Protocol Evolution"
        description="Our transparent roadmap from initial concept to a fully decentralized, community-governed identity layer."
      />

      <RoadmapSection />
    </div>
  );
}
