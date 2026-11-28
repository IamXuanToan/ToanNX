import { createResourceKeys } from "@/shares/lib/api/resource-keys";

import type { AttachmentFilters } from "../types/attachment.types";

/** Phạm vi chung của query key module System (invalidate cả module bằng `["system"]`). */
export const SYSTEM_SCOPE = "system";

const users = createResourceKeys(SYSTEM_SCOPE, "users");
const journalEntries = createResourceKeys(SYSTEM_SCOPE, "journal");

/** Query key của người dùng. */
export const accountKeys = {
  all: users.all,
  users: (filters: object) => users.list(filters),
  user: (id: string) => users.detail(id),
  userHistory: (id: string) => users.history(id),
};

/** Query key của đăng nhập và phiên (người dùng hiện tại, quản trị phiên). */
export const authKeys = {
  all: [SYSTEM_SCOPE, "auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  socialAccounts: () => [...authKeys.all, "social-accounts"] as const,
  adminSessions: (filters?: object) =>
    [...authKeys.all, "admin-sessions", ...(filters ? [filters] : [])] as const,
  adminSessionUsers: () => [...authKeys.all, "admin-session-users"] as const,
};

/** Query key của vai trò, quyền và vai trò của người dùng. */
export const iamKeys = {
  all: [SYSTEM_SCOPE, "iam"] as const,
  userRoles: (userId: string) => [...iamKeys.all, "user-roles", userId] as const,
  roles: (filters: object) => [...iamKeys.all, "roles", filters] as const,
  roleOptions: () => [...iamKeys.all, "role-options"] as const,
  role: (id: string) => [...iamKeys.all, "role", id] as const,
  permissions: () => [...iamKeys.all, "permissions"] as const,
};

/** Query key của thư viện file, dùng lại ở bộ chọn ảnh. */
export const attachmentKeys = {
  all: [SYSTEM_SCOPE, "attachments"] as const,
  folders: (scope?: readonly string[]) => [...attachmentKeys.all, "folders", scope ?? []] as const,
  lists: () => [...attachmentKeys.all, "list"] as const,
  list: (filters: AttachmentFilters) => [...attachmentKeys.lists(), filters] as const,
};

/** Query key của nhật ký thay đổi; `all` bao cả danh mục tài nguyên và lịch sử từng bản ghi. */
export const journalKeys = {
  all: journalEntries.all,
  entries: (filters: object) => journalEntries.list(filters),
  entry: (id: string) => journalEntries.detail(id),
  resources: () => [...journalEntries.all, "resources"] as const,
  /** Lịch sử của một bản ghi theo path `…/{id}/history` của tài nguyên đó. */
  record: (path: string) => [...journalEntries.all, "record", path] as const,
};

const settings = createResourceKeys(SYSTEM_SCOPE, "settings");

/** Query key của cấu hình hệ thống. */
export const settingKeys = {
  ...settings,
  public: () => [SYSTEM_SCOPE, "settings", "public"] as const,
};

/** Query key của mẫu email (`EmailTemplate`). */
export const emailTemplateKeys = createResourceKeys(SYSTEM_SCOPE, "email-templates");

const baseLanguageKeys = createResourceKeys(SYSTEM_SCOPE, "languages");

/** Query key của danh mục ngôn ngữ (`Language`). */
export const languageKeys = {
  ...baseLanguageKeys,
  active: () => [SYSTEM_SCOPE, "languages", "active"] as const,
};

/** Query key phần Thông báo (chuông, tùy chọn, thiết bị, Telegram, nhật ký gửi, thông báo hệ thống). */
export const notificationKeys = {
  all: [SYSTEM_SCOPE, "notifications"] as const,
  bell: (scope: string) => [SYSTEM_SCOPE, "notifications", "bell", scope] as const,
  unreadCount: () => [SYSTEM_SCOPE, "notifications", "unread-count"] as const,
  preferences: () => [SYSTEM_SCOPE, "notifications", "preferences"] as const,
  devices: () => [SYSTEM_SCOPE, "notifications", "devices"] as const,
  telegramBot: () => [SYSTEM_SCOPE, "notifications", "telegram-bot"] as const,
  chats: () => [SYSTEM_SCOPE, "notifications", "chats"] as const,
  deliveries: createResourceKeys(SYSTEM_SCOPE, "notification-deliveries"),
  announcements: createResourceKeys(SYSTEM_SCOPE, "announcements"),
};

/** Query key tiền tệ và tỷ giá. */
export const currencyKeys = {
  currencies: createResourceKeys(SYSTEM_SCOPE, "currencies"),
  rates: createResourceKeys(SYSTEM_SCOPE, "exchange-rates"),
  resolve: (currencyId: string, date: string) =>
    [SYSTEM_SCOPE, "exchange-rates", "resolve", currencyId, date] as const,
};

/** Query key danh mục webhook. */
export const webhookKeys = {
  all: [SYSTEM_SCOPE, "webhooks"] as const,
};

/** Query key danh mục callback. */
export const callbackKeys = {
  all: [SYSTEM_SCOPE, "callbacks"] as const,
};
