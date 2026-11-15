import { UserRound, Users } from "lucide-react";

import type { AdminModuleNavigation } from "@/shares/types/navigation.types";

import { ACCOUNT_PERMISSIONS } from "./constants/account-permissions";
import { ACCOUNT_ROUTES } from "./constants/routes";

/** Menu sidebar của module Account. */
export const accountNavigation: AdminModuleNavigation = {
  module: "account",
  nameKey: "common.adminModules.account.name",
  descriptionKey: "common.adminModules.account.description",
  group: "system",
  icon: UserRound,
  items: [
    {
      labelKey: "common.nav.users",
      href: ACCOUNT_ROUTES.users,
      icon: Users,
      permission: ACCOUNT_PERMISSIONS.userRead,
    },
  ],
};
