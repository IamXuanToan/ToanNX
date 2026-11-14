import { LayoutDashboard } from "lucide-react";

import { APP_ROUTES } from "@/shares/constants/routes";
import type { AdminNavItem } from "@/shares/types/navigation.types";

/** Điều hướng admin của module Dashboard. */
export const dashboardNavigation: AdminNavItem[] = [
  { labelKey: "dashboard", href: APP_ROUTES.admin, icon: LayoutDashboard, module: "iam" },
];
