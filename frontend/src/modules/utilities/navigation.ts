import {
  FileText,
  HeartHandshake,
  LayoutDashboard,
  Link2,
  QrCode,
  Route,
  Wrench,
} from "lucide-react";

import type { AdminModuleNavigation } from "@/shares/types/navigation.types";

import { UTILITIES_ROUTES } from "./constants/routes";
import { DONATION_PERMISSIONS } from "./permissions/donation-permission";
import { PAGE_PATH_PERMISSIONS } from "./permissions/page-path-permission";
import { PAGE_PERMISSIONS } from "./permissions/page-permission";
import { QR_CODE_PERMISSIONS } from "./permissions/qr-code-permission";
import { SHORT_LINK_PERMISSIONS } from "./permissions/short-link-permission";

/**
 * Điều hướng của module Tiện ích (mã BE `utilities`) trong nhóm `content`: link rút gọn, mã QR, trang,
 * quyên góp và đường dẫn giữa. Chia thành 3 cụm chuẩn quy tắc repo.
 */
export const utilitiesNavigation: AdminModuleNavigation = {
  module: "utilities",
  nameKey: "utilities.module.name",
  descriptionKey: "utilities.module.description",
  group: "content",
  icon: Wrench,
  items: [
    {
      labelKey: "utilities.nav.dashboard",
      href: UTILITIES_ROUTES.dashboard,
      icon: LayoutDashboard,
      permission: [
        PAGE_PERMISSIONS.read,
        SHORT_LINK_PERMISSIONS.read,
        QR_CODE_PERMISSIONS.read,
        DONATION_PERMISSIONS.read,
        PAGE_PATH_PERMISSIONS.read,
      ],
      section: "utilities.navSections.overview",
    },
    {
      labelKey: "utilities.nav.donations",
      href: UTILITIES_ROUTES.donations,
      icon: HeartHandshake,
      permission: DONATION_PERMISSIONS.read,
      section: "utilities.navSections.overview",
    },
    {
      labelKey: "utilities.nav.pages",
      href: UTILITIES_ROUTES.pages,
      icon: FileText,
      permission: PAGE_PERMISSIONS.read,
      section: "utilities.navSections.content",
    },
    {
      labelKey: "utilities.nav.pagePaths",
      href: UTILITIES_ROUTES.pagePaths,
      icon: Route,
      permission: PAGE_PATH_PERMISSIONS.read,
      section: "utilities.navSections.content",
    },
    {
      labelKey: "utilities.nav.shortLinks",
      href: UTILITIES_ROUTES.shortLinks,
      icon: Link2,
      permission: SHORT_LINK_PERMISSIONS.read,
      section: "utilities.navSections.tools",
    },
    {
      labelKey: "utilities.nav.qrCodes",
      href: UTILITIES_ROUTES.qrCodes,
      icon: QrCode,
      permission: QR_CODE_PERMISSIONS.read,
      section: "utilities.navSections.tools",
    },
  ],
};
