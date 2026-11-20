import { SESSION_API_PATHS } from "@/shares/lib/api/session-paths";

/**
 * Endpoint API của module System (tương đối với `env.apiBasePath`, khớp `/api/v1/system/...` ở BE).
 * Tài nguyên CRUD chỉ khai path gốc; `{id}`, `bulk-*`, `history` do `createCrudService` dựng theo router BE.
 */
export const SYSTEM_API_ENDPOINTS = {
  ...SESSION_API_PATHS,
  passwordResetRequest: "/system/auth/password-reset/request",
  passwordResetValidate: "/system/auth/password-reset/validate-token",
  passwordResetConfirm: "/system/auth/password-reset/confirm",
  logoutAll: "/system/auth/logout-all",
  me: "/system/auth/me",
  sessions: "/system/auth/sessions",
  adminSessions: "/system/auth/admin-sessions",
  users: "/system/users",
  userRoles: (userId: string) => `/system/users/${userId}/roles`,
  roles: "/system/roles",
  rolePermissions: (roleId: string) => `/system/roles/${roleId}/permissions`,
  permissions: "/system/permissions",
  attachments: "/system/attachments",
  attachmentFolders: "/system/attachments/folders",
  attachmentFolder: (id: string) => `/system/attachments/folders/${id}`,
  attachmentFolderDelete: (id: string) => `/system/attachments/folders/${id}/delete`,
  journalEntries: "/system/journal-entries",
  journalResources: "/system/journal-resources",
} as const;
