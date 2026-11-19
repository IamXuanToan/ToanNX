import { BookOpen } from "lucide-react";

import type { AdminModuleNavigation } from "@/shares/types/navigation.types";

import { NOVEL_ROUTES } from "./constants/routes";
import { NOVEL_PERMISSIONS } from "./permissions/novel-permission";

/**
 * Cấu hình điều hướng quản trị của module Novel (Truyện chữ).
 *
 * Khai báo nhóm hiển thị độc lập "novel", các mục menu quản lý và quyền hạn truy cập tương ứng.
 */
export const novelNavigation: AdminModuleNavigation = {
  module: "novel",
  nameKey: "novel.module.name",
  descriptionKey: "novel.module.description",
  group: "novel",
  icon: BookOpen,
  items: [
    {
      labelKey: "novel.nav.novels",
      href: NOVEL_ROUTES.adminNovels,
      icon: BookOpen,
      permission: NOVEL_PERMISSIONS.read,
    },
  ],
};
