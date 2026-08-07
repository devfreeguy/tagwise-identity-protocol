import Image from "next/image";

import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/**
 * Shared chrome (nav title/links) between the docs layout and any other
 * layout this app adds later. Kept in one place so they can never drift.
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2">
          <Image src="/app-logo.png" alt="Tagwise" width={24} height={24} className="rounded-md" />
          <span className="font-semibold">Tagwise</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
            Devnet
          </span>
        </span>
      ),
    },
    githubUrl: "https://github.com/devfreeguy/tagwise-identity-protocol",
  };
}
