import { createResourceKeys } from "@/shares/lib/api/resource-keys";

import type { AttachmentFilters } from "../types/attachment.types";

/** Phạm vi chung của query key module System (invalidate cả module bằng `["system"]`). */
const SCOPE = "system";

const users = createResourceKeys(SCOPE, "users");
const journalEntries = createResourceKeys(SCOPE, "journal");

/** Query key của người dùng. */
export const accountKeys = {
  all: users.all,
  users: (filters: object) => users.list(filters),
  user: (id: string) => users.detail(id),
  userHistory: (id: string) => users.history(id),
};

/** Query key của đăng nhập và phiên (người dùng hiện tại, quản trị phiên). */
export const authKeys = {
  all: [SCOPE, "auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  adminSessions: (filters?: object) =>
    [...authKeys.all, "admin-sessions", ...(filters ? [filters] : [])] as const,
  adminSessionUsers: () => [...authKeys.all, "admin-session-users"] as const,
};

/** Query key của vai trò, quyền và vai trò của người dùng. */
export const iamKeys = {
  all: [SCOPE, "iam"] as const,
  userRoles: (userId: string) => [...iamKeys.all, "user-roles", userId] as const,
  roles: (filters: object) => [...iamKeys.all, "roles", filters] as const,
  roleOptions: () => [...iamKeys.all, "role-options"] as const,
  role: (id: string) => [...iamKeys.all, "role", id] as const,
  permissions: () => [...iamKeys.all, "permissions"] as const,
};

/** Query key của thư viện file, dùng lại ở bộ chọn ảnh. */
export const attachmentKeys = {
  all: [SCOPE, "attachments"] as const,
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
