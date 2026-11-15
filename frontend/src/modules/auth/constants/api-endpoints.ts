import { SESSION_API_PATHS } from "@/shares/lib/api/session-paths";

/** Endpoint API của module Auth (tương đối với `env.apiBasePath`). */
export const AUTH_API_ENDPOINTS = {
  ...SESSION_API_PATHS,
  logoutAll: "/auth/logout-all",
  me: "/auth/me",
  sessions: "/auth/sessions",
  adminSessionsBulkDelete: "/auth/admin-sessions/bulk-delete",
  adminSessions: "/auth/admin-sessions",
  adminSessionUsers: "/auth/admin-sessions/users",
  adminSessionsBulkRevoke: "/auth/admin-sessions/bulk-revoke",
  adminSession: (id: string) => `/auth/admin-sessions/${id}`,
} as const;
