import {
  Bell,
  Coins,
  Languages,
  Mail,
  Megaphone,
  TrendingUp,
  History,
  Images,
  KeyRound,
  Monitor,
  Settings,
  ShieldCheck,
  Users,
  Webhook,
  CornerDownLeft,
} from "lucide-react";

import type { AdminModuleNavigation } from "@/shares/types/navigation.types";

import { SYSTEM_ROUTES } from "./constants/routes";
import { ATTACHMENT_PERMISSIONS } from "./permissions/attachment-permission";
import { CALLBACK_PERMISSIONS } from "./permissions/callback-permission";
import { CURRENCY_PERMISSIONS } from "./permissions/currency-permission";
import { EMAIL_TEMPLATE_PERMISSIONS } from "./permissions/email-template-permission";
import { EXCHANGE_RATE_PERMISSIONS } from "./permissions/exchange-rate-permission";
import { IAM_PERMISSIONS } from "./permissions/iam-permission";
import { JOURNAL_ENTRY_PERMISSIONS } from "./permissions/journal-entry-permission";
import { LANGUAGE_PERMISSIONS } from "./permissions/language-permission";
import { ANNOUNCEMENT_PERMISSIONS } from "./permissions/announcement-permission";
import { NOTIFICATION_DELIVERY_PERMISSIONS } from "./permissions/notification-delivery-permission";
import { WEBHOOK_PERMISSIONS } from "./permissions/webhook-permission";
import { SESSION_PERMISSIONS } from "./permissions/session-permission";
import { SETTING_PERMISSIONS } from "./permissions/setting-permission";
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
      section: "system.navSections.access",
    },
    {
      labelKey: "common.nav.sessions",
      href: SYSTEM_ROUTES.sessions,
      icon: Monitor,
      permission: SESSION_PERMISSIONS.sessionRead,
      section: "system.navSections.access",
    },
    {
      labelKey: "common.nav.roles",
      href: SYSTEM_ROUTES.roles,
      icon: ShieldCheck,
      permission: IAM_PERMISSIONS.roleRead,
      section: "system.navSections.access",
    },
    {
      labelKey: "common.nav.permissions",
      href: SYSTEM_ROUTES.permissions,
      icon: KeyRound,
      permission: IAM_PERMISSIONS.permissionRead,
      section: "system.navSections.access",
    },
    {
      labelKey: "common.nav.attachments",
      href: SYSTEM_ROUTES.library,
      icon: Images,
      permission: ATTACHMENT_PERMISSIONS.read,
      section: "system.navSections.library",
    },
    {
      labelKey: "system.notifications.nav",
      href: SYSTEM_ROUTES.notifications,
      icon: Bell,
      permission: NOTIFICATION_DELIVERY_PERMISSIONS.read,
      section: "system.navSections.notifications",
    },
    {
      labelKey: "system.notifications.announcements.nav",
      href: SYSTEM_ROUTES.announcements,
      icon: Megaphone,
      permission: ANNOUNCEMENT_PERMISSIONS.read,
      section: "system.navSections.notifications",
    },
    {
      labelKey: "system.emailTemplates.nav",
      href: SYSTEM_ROUTES.emailTemplates,
      icon: Mail,
      permission: EMAIL_TEMPLATE_PERMISSIONS.read,
      section: "system.navSections.notifications",
    },
    {
      labelKey: "system.currencies.nav",
      href: SYSTEM_ROUTES.currencies,
      icon: Coins,
      permission: CURRENCY_PERMISSIONS.read,
      section: "system.navSections.catalogs",
    },
    {
      labelKey: "system.exchangeRates.nav",
      href: SYSTEM_ROUTES.exchangeRates,
      icon: TrendingUp,
      permission: EXCHANGE_RATE_PERMISSIONS.read,
      section: "system.navSections.catalogs",
    },
    {
      labelKey: "system.languages.nav",
      href: SYSTEM_ROUTES.languages,
      icon: Languages,
      permission: LANGUAGE_PERMISSIONS.read,
      section: "system.navSections.catalogs",
    },
    {
      labelKey: "system.webhooks.nav",
      href: SYSTEM_ROUTES.webhooks,
      icon: Webhook,
      permission: WEBHOOK_PERMISSIONS.read,
      section: "system.navSections.integrations",
    },
    {
      labelKey: "system.callbacks.nav",
      href: SYSTEM_ROUTES.callbacks,
      icon: CornerDownLeft,
      permission: CALLBACK_PERMISSIONS.read,
      section: "system.navSections.integrations",
    },
    {
      labelKey: "common.nav.settings",
      href: SYSTEM_ROUTES.settings,
      icon: Settings,
      permission: SETTING_PERMISSIONS.settingRead,
      section: "system.navSections.operations",
    },
    {
      labelKey: "system.journal.nav.entries",
      href: SYSTEM_ROUTES.journalEntries,
      icon: History,
      permission: JOURNAL_ENTRY_PERMISSIONS.entryRead,
      section: "system.navSections.operations",
    },
  ],
};
