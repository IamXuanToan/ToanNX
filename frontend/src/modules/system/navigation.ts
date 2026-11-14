import { Boxes } from "lucide-react";

import { APP_ROUTES } from "@/shares/constants/routes";
import type { AdminNavItem } from "@/shares/types/navigation.types";

/** Mã quyền module System (khớp backend `SystemPermission`). */
export const SYSTEM_PERMISSIONS = {
  moduleRead: "system.module.read",
  moduleManage: "system.module.manage",
} as const;

/** Điều hướng admin của module System. */
export const systemNavigation: AdminNavItem[] = [
  {
    labelKey: "modules",
    href: APP_ROUTES.adminModules,
    icon: Boxes,
    module: "system",
    permission: SYSTEM_PERMISSIONS.moduleRead,
  },
];
