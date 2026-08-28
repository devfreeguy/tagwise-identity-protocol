import type { Metadata } from "next";

import { IconShieldLock } from "@tabler/icons-react";

import { LegalDocument } from "@/components/legal/LegalDocument";
import { getLegalDoc } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  const { frontmatter } = await getLegalDoc("privacy");

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    alternates: { canonical: "/privacy" },
  };
}

export default function PrivacyPage() {
  return <LegalDocument slug="privacy" icon={IconShieldLock} />;
}
