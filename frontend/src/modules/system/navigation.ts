import { History, Images, KeyRound, Monitor, Settings, ShieldCheck, Users } from "lucide-react";

import type { AdminModuleNavigation } from "@/shares/types/navigation.types";

import { SYSTEM_ROUTES } from "./constants/routes";
import { ATTACHMENT_PERMISSIONS } from "./permissions/attachment-permission";
import { IAM_PERMISSIONS } from "./permissions/iam-permission";
import { JOURNAL_ENTRY_PERMISSIONS } from "./permissions/journal-entry-permission";
import { SESSION_PERMISSIONS } from "./permissions/session-permission";
import { USER_PERMISSIONS } from "./permissions/user-permission";

/**
 * Điều hướng của module System (mã BE `system`) trong nhóm `system`: người dùng, phiên, vai trò, quyền,
 * thư viện và nhật ký. Mỗi mục chỉ hiện khi người dùng có quyền đọc tài nguyên tương ứng.
 */
export const systemNavigation: AdminModuleNavigation = {
  module: "system",
  nameKey: "system.module.name",
  descriptionKey: "system.module.description",
  group: "system",
  icon: Settings,
  items: [
    {
      labelKey: "common.nav.users",
      href: SYSTEM_ROUTES.users,
      icon: Users,
      permission: USER_PERMISSIONS.userRead,
    },
    {
      labelKey: "common.nav.sessions",
      href: SYSTEM_ROUTES.sessions,
      icon: Monitor,
      permission: SESSION_PERMISSIONS.sessionRead,
    },
    {
      labelKey: "common.nav.roles",
      href: SYSTEM_ROUTES.roles,
      icon: ShieldCheck,
      permission: IAM_PERMISSIONS.roleRead,
    },
    {
      labelKey: "common.nav.permissions",
      href: SYSTEM_ROUTES.permissions,
      icon: KeyRound,
      permission: IAM_PERMISSIONS.permissionRead,
    },
    {
      labelKey: "common.nav.attachments",
      href: SYSTEM_ROUTES.library,
      icon: Images,
      permission: ATTACHMENT_PERMISSIONS.read,
    },
    {
      labelKey: "system.journal.nav.entries",
      href: SYSTEM_ROUTES.journalEntries,
      icon: History,
      permission: JOURNAL_ENTRY_PERMISSIONS.entryRead,
    },
  ],
};
