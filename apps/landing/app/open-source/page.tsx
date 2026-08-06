import { OpenSourceSection } from "../../components/sections/OpenSourceSection";
import { CommunitySection } from "../../components/sections/CommunitySection";
import { PageHero } from "../../components/ui/PageHero";
import { IconBrandGithub } from "@tabler/icons-react";

export default function OpenSource() {
  return (
    <div className="pb-16">
      <PageHero
        icon={IconBrandGithub}
        title="Open Source Infrastructure"
        description="Tagwise is built by the community, for the community. Explore our monorepo architecture and join the ecosystem."
      />

      <OpenSourceSection />
      <CommunitySection />
    </div>
  );
}
