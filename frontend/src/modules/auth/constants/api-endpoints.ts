import { SESSION_API_PATHS } from "@/shares/lib/api/session-paths";

/**
 * Endpoint API của module Auth (tương đối với `env.apiBasePath`).
 * Tài nguyên CRUD chỉ khai path gốc; `{id}`, `bulk-*`, action dựng theo router BE.
 */
export const AUTH_API_ENDPOINTS = {
  ...SESSION_API_PATHS,
  passwordResetRequest: "/auth/password-reset/request",
  passwordResetValidate: "/auth/password-reset/validate-token",
  passwordResetConfirm: "/auth/password-reset/confirm",
  logoutAll: "/auth/logout-all",
  me: "/auth/me",
  sessions: "/auth/sessions",
  adminSessions: "/auth/admin-sessions",
} as const;
