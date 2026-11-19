import { FileText, Route } from "lucide-react";

import type { AdminModuleNavigation } from "@/shares/types/navigation.types";

import { PAGE_PATH_PERMISSIONS } from "./permissions/page-path-permission";
import { PAGE_PERMISSIONS } from "./permissions/page-permission";
import { CUSTOM_PAGES_ROUTES } from "./constants/routes";

/** Trang và Đường dẫn giữa nằm trong nhóm Tiện ích. */
export const customPagesNavigation: AdminModuleNavigation = {
  module: "custom_pages",
  nameKey: "customPages.module.name",
  descriptionKey: "customPages.module.description",
  group: "content",
  icon: FileText,
  items: [
    {
      labelKey: "customPages.nav.pages",
      href: CUSTOM_PAGES_ROUTES.pages,
      icon: FileText,
      permission: PAGE_PERMISSIONS.read,
    },
    {
      labelKey: "customPages.nav.paths",
      href: CUSTOM_PAGES_ROUTES.paths,
      icon: Route,
      permission: PAGE_PATH_PERMISSIONS.pathRead,
    },
  ],
};
