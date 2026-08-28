import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

import { legalMdxComponents } from "@/components/legal/mdx-components";

export const LEGAL_SLUGS = ["privacy", "terms", "cookies", "security"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export interface LegalFrontmatter {
  title: string;
  description: string;
  lastUpdated: string;
}

// cache() dedupes this across generateMetadata and the page render within
// the same request -- the file is only read/compiled once per document.
export const getLegalDoc = cache(async (slug: LegalSlug) => {
  const filePath = path.join(process.cwd(), "content", "legal", `${slug}.md`);
  const source = await readFile(filePath, "utf-8");

  return compileMDX<LegalFrontmatter>({
    source,
    components: legalMdxComponents,
    options: {
      parseFrontmatter: true,
      mdxOptions: { remarkPlugins: [remarkGfm] },
    },
  });
});
