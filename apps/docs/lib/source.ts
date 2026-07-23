import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";
import { openapiPlugin } from "fumadocs-openapi/server";
import * as TablerIcons from "@tabler/icons-react";
import { createElement, type ComponentType } from "react";

export const source = loader({
  baseUrl: "/",
  source: docs.toFumadocsSource(),
  plugins: [openapiPlugin()],
  icon(icon) {
    if (!icon) return;
    if (icon.startsWith("Icon") && icon in TablerIcons) {
      const IconComponent = TablerIcons[icon as keyof typeof TablerIcons] as ComponentType<{ size?: number }>;
      return createElement(IconComponent, {
        size: 18,
      });
    }
  },
});
