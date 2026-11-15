import { Monitor } from "lucide-react";

import type { AdminNavItem } from "@/shares/types/navigation.types";

import { AUTH_PERMISSIONS } from "./constants/auth-permissions";
import { AUTH_ROUTES } from "./constants/routes";

/** Mục quản trị phiên ghép vào nhóm Tài khoản tại composition root. */
export const authenticationAccountItems: AdminNavItem[] = [
  {
    labelKey: "sessions",
    href: AUTH_ROUTES.sessions,
    icon: Monitor,
    permission: AUTH_PERMISSIONS.sessionRead,
  },
];
