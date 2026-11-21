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
  sendVerificationEmail: "/system/auth/send-verification-email",
  verifyEmail: "/system/auth/verify-email",
  invitation: "/system/auth/invitation",
  acceptInvitation: "/system/auth/accept-invitation",
  socialAuthUrl: (provider: string) => `/system/auth/social/${provider}/url`,
  socialLogin: (provider: string) => `/system/auth/social/${provider}/login`,
  socialAccounts: "/system/auth/social/accounts",
  socialLink: (provider: string) => `/system/auth/social/${provider}/link`,
  socialUnlink: (provider: string) => `/system/auth/social/${provider}/unlink`,
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
  settings: "/system/settings",
  publicSettings: "/system/settings/public",
} as const;
