import { ShieldCheck } from "lucide-react";

import { APP_ROUTES } from "@/shares/constants/routes";
import type { AdminNavItem } from "@/shares/types/navigation.types";

import { IAM_PERMISSIONS } from "./constants/iam-permissions";

/** Điều hướng admin của module IAM. */
export const iamNavigation: AdminNavItem[] = [
  {
    labelKey: "roles",
    href: APP_ROUTES.adminRoles,
    icon: ShieldCheck,
    module: "iam",
    permission: IAM_PERMISSIONS.roleRead,
  },
];
