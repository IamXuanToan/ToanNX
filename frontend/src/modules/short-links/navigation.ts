import { Link2 } from "lucide-react";

import type { AdminModuleNavigation } from "@/shares/types/navigation.types";

import { SHORT_LINKS_ROUTES } from "./constants/routes";
import { SHORT_LINKS_PERMISSIONS } from "./constants/short-links-permissions";

/** Link rút gọn nằm trong nhóm Tiện ích. */
export const shortLinksNavigation: AdminModuleNavigation = {
  module: "short_links",
  nameKey: "shortLinks.module.name",
  descriptionKey: "shortLinks.module.description",
  group: "content",
  icon: Link2,
  items: [
    {
      labelKey: "shortLinks.nav.links",
      href: SHORT_LINKS_ROUTES.links,
      icon: Link2,
      permission: SHORT_LINKS_PERMISSIONS.read,
    },
  ],
};
