import { Users } from "lucide-react";

import { APP_ROUTES } from "@/shares/constants/routes";
import type { AdminNavItem } from "@/shares/types/navigation.types";

import { ACCOUNT_PERMISSIONS } from "./constants/account-permissions";

/** Điều hướng admin của module Account. */
export const accountNavigation: AdminNavItem[] = [
  {
    labelKey: "users",
    href: APP_ROUTES.adminUsers,
    icon: Users,
    module: "account",
    permission: ACCOUNT_PERMISSIONS.userRead,
  },
];
