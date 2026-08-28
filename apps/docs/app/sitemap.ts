import type { MetadataRoute } from "next";

import { source } from "@/lib/source";

const BASE_URL = "https://docs.tagwise.me";

export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => {
    // depth 0 = docs root ("/"), depth 1 = section index (e.g. "/concepts"),
    // depth 2+ = leaf pages (e.g. "/concepts/architecture").
    const depth = page.slugs.length;

    return {
      url: `${BASE_URL}${page.url}`,
      lastModified: new Date(),
      changeFrequency: depth <= 1 ? "weekly" : "monthly",
      priority: depth === 0 ? 1.0 : depth === 1 ? 0.8 : 0.7,
    };
  });
}
