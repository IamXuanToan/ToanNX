/** Query key React Query của module Auth. */
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  adminSessions: (filters?: object) =>
    [...authKeys.all, "admin-sessions", ...(filters ? [filters] : [])] as const,
  adminSessionUsers: () => [...authKeys.all, "admin-session-users"] as const,
};
