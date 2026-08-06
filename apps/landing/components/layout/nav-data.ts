import {
  IconBrandGithub,
  IconBrandDiscord,
  IconBrandX,
  IconBrandTelegram,
  IconCode,
  IconBook,
  IconTimeline,
  IconShieldLock,
  IconCpu,
} from "@tabler/icons-react";
import React from "react";
import { LINKS } from "../../lib/constants";

export interface NavItem {
  title: string;
  href: string;
  description: string;
  icon: React.ElementType;
  external?: boolean;
}

export interface NavGroup {
  label: string;
  hasSocialColumn?: boolean;
  items: NavItem[];
}

export interface NavLink {
  label: string;
  href?: string;
  external?: boolean;
  isGroup?: boolean;
  group?: NavGroup;
}

export interface SocialButton {
  icon: React.ElementType;
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  {
    label: "Protocol",
    isGroup: true,
    group: {
      label: "Protocol",
      hasSocialColumn: true,
      items: [
        {
          title: "Technology",
          href: "/technology",
          description: "Discover the decentralized identity architecture.",
          icon: IconCpu,
        },
        {
          title: "Roadmap",
          href: "/roadmap",
          description: "Explore the current milestones and future trajectory.",
          icon: IconTimeline,
        },
        {
          title: "Open Source",
          href: "/open-source",
          description: "View our transparent monorepo and smart contracts.",
          icon: IconBrandGithub,
        },
      ],
    },
  },
  {
    label: "Developers",
    isGroup: true,
    group: {
      label: "Developers",
      hasSocialColumn: false,
      items: [
        {
          title: "Developer Portal",
          href: "/developers",
          description: "Resources for integrating Tagwise into your dApp.",
          icon: IconCode,
        },
        {
          title: "Documentation",
          href: LINKS.DOCS,
          description: "Comprehensive guides and API references.",
          icon: IconBook,
          external: true,
        },
      ],
    },
  },
  { label: "Whitepaper", href: "#", external: true },
];

export const SOCIAL_BUTTONS: SocialButton[] = [
  { icon: IconBrandX, href: LINKS.TWITTER, label: "X (Twitter)" },
  { icon: IconBrandTelegram, href: "#", label: "Telegram" },
  { icon: IconBrandDiscord, href: "#", label: "Discord" },
  { icon: IconBrandGithub, href: LINKS.GITHUB, label: "GitHub" },
];
