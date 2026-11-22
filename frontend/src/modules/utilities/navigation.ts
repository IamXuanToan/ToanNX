import { FileText, Link2, QrCode, Route, Wrench } from "lucide-react";

import type { AdminModuleNavigation } from "@/shares/types/navigation.types";

import { UTILITIES_ROUTES } from "./constants/routes";
import { PAGE_PATH_PERMISSIONS } from "./permissions/page-path-permission";
import { PAGE_PERMISSIONS } from "./permissions/page-permission";
import { QR_CODE_PERMISSIONS } from "./permissions/qr-code-permission";
import { SHORT_LINK_PERMISSIONS } from "./permissions/short-link-permission";

/**
 * Điều hướng của module Tiện ích (mã BE `utilities`) trong nhóm `content`: link rút gọn, mã QR, trang
 * và đường dẫn giữa. Mỗi mục chỉ hiện khi người dùng có quyền đọc tài nguyên tương ứng.
 */
export const utilitiesNavigation: AdminModuleNavigation = {
  module: "utilities",
  nameKey: "utilities.module.name",
  descriptionKey: "utilities.module.description",
  group: "content",
  icon: Wrench,
  items: [
    {
      labelKey: "utilities.nav.shortLinks",
      href: UTILITIES_ROUTES.shortLinks,
      icon: Link2,
      permission: SHORT_LINK_PERMISSIONS.read,
    },
    {
      labelKey: "utilities.nav.qrCodes",
      href: UTILITIES_ROUTES.qrCodes,
      icon: QrCode,
      permission: QR_CODE_PERMISSIONS.read,
    },
    {
      labelKey: "utilities.nav.pages",
      href: UTILITIES_ROUTES.pages,
      icon: FileText,
      permission: PAGE_PERMISSIONS.read,
    },
    {
      labelKey: "utilities.nav.pagePaths",
      href: UTILITIES_ROUTES.pagePaths,
      icon: Route,
      permission: PAGE_PATH_PERMISSIONS.read,
    },
  ],
};
