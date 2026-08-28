import type { ElementType } from "react";

import { PageHero } from "@/components/ui/PageHero";
import { getLegalDoc, type LegalSlug } from "@/lib/legal";

interface LegalDocumentProps {
  slug: LegalSlug;
  icon: ElementType;
}

export async function LegalDocument({ slug, icon }: LegalDocumentProps) {
  const { content, frontmatter } = await getLegalDoc(slug);

  const formattedDate = new Date(frontmatter.lastUpdated).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="pb-24">
      <PageHero icon={icon} title={frontmatter.title} description={frontmatter.description} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground mb-10">Last updated {formattedDate}</p>
        <article className="doc-content">{content}</article>
      </div>
    </div>
  );
}
