import { KeyRound, ShieldCheck } from "lucide-react";

import type { AdminModuleNavigation } from "@/shares/types/navigation.types";

import { IAM_PERMISSIONS } from "./constants/iam-permissions";
import { IAM_ROUTES } from "./constants/routes";

/** Menu sidebar của module IAM. */
export const iamNavigation: AdminModuleNavigation = {
  module: "iam",
  group: "system",
  icon: KeyRound,
  items: [
    {
      labelKey: "roles",
      href: IAM_ROUTES.roles,
      icon: ShieldCheck,
      permission: IAM_PERMISSIONS.roleRead,
    },
    {
      labelKey: "permissions",
      href: IAM_ROUTES.permissions,
      icon: KeyRound,
      permission: IAM_PERMISSIONS.permissionRead,
    },
  ],
};
