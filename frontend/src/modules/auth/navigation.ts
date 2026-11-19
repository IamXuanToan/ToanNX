import { Monitor } from "lucide-react";

import type { AdminNavItem } from "@/shares/types/navigation.types";

import { SESSION_PERMISSIONS } from "./permissions/session-permission";
import { AUTH_ROUTES } from "./constants/routes";

/** Mục quản trị phiên ghép vào nhóm Tài khoản tại composition root. */
export const authenticationAccountItems: AdminNavItem[] = [
  {
    labelKey: "common.nav.sessions",
    href: AUTH_ROUTES.sessions,
    icon: Monitor,
    permission: SESSION_PERMISSIONS.sessionRead,
  },
];
