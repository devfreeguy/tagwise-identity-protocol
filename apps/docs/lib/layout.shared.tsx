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
        <>
          <Image src="/logo.jpg" alt="TIP" width={24} height={24} className="rounded-md" />
          TIP
        </>
      ),
    },
    githubUrl: "https://github.com/devfreeguy/tagwise-identity-protocol",
  };
}
