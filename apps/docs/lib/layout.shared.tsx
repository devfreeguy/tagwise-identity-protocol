import Image from "next/image";
import { IconBook, IconCompass, IconBolt, IconPlug, IconCode, IconServer } from "@tabler/icons-react";

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
          <Image src="/logo.jpg" alt="Tagwise" width={24} height={24} className="rounded-md" />
          Tagwise
        </>
      ),
    },
    links: [
      {
        icon: <IconCompass size={18} />,
        text: "Concepts",
        url: "/concepts",
      },
      {
        icon: <IconBolt size={18} />,
        text: "Quickstart",
        url: "/quickstart",
      },
      {
        icon: <IconPlug size={18} />,
        text: "Guides",
        url: "/integration-guides",
      },
      {
        icon: <IconCode size={18} />,
        text: "SDK",
        url: "/sdk-reference",
      },
      {
        icon: <IconServer size={18} />,
        text: "API",
        url: "/api-reference",
      },
    ],
    githubUrl: "https://github.com/devfreeguy/tagwise-identity-protocol",
  };
}

