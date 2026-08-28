import type { Metadata } from "next";

import { IconGavel } from "@tabler/icons-react";

import { LegalDocument } from "@/components/legal/LegalDocument";
import { getLegalDoc } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  const { frontmatter } = await getLegalDoc("terms");

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    alternates: { canonical: "/terms" },
  };
}

export default function TermsPage() {
  return <LegalDocument slug="terms" icon={IconGavel} />;
}
