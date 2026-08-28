import type { Metadata } from "next";

import { IconCookie } from "@tabler/icons-react";

import { LegalDocument } from "@/components/legal/LegalDocument";
import { getLegalDoc } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  const { frontmatter } = await getLegalDoc("cookies");

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    alternates: { canonical: "/cookies" },
  };
}

export default function CookiesPage() {
  return <LegalDocument slug="cookies" icon={IconCookie} />;
}
