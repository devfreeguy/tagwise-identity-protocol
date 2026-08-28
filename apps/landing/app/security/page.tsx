import type { Metadata } from "next";

import { IconShieldCheck } from "@tabler/icons-react";

import { LegalDocument } from "@/components/legal/LegalDocument";
import { getLegalDoc } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  const { frontmatter } = await getLegalDoc("security");

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    alternates: { canonical: "/security" },
  };
}

export default function SecurityPage() {
  return <LegalDocument slug="security" icon={IconShieldCheck} />;
}
