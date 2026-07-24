import type { ReactNode } from "react";

import { DocsLayout } from "fumadocs-ui/layouts/docs";

import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";
import { NavVersionBadges } from "@/components/version-badges";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      sidebar={{
        // Renders below the GitHub + ThemeSwitch icon strip at the sidebar bottom.
        footer: <NavVersionBadges />,
      }}
    >
      {children}
    </DocsLayout>
  );
}
