/** Endpoint API của module Account (tương đối với `env.apiBasePath`). */
export const ACCOUNT_API_ENDPOINTS = {
  users: "/account/users",
  user: (id: string) => `/account/users/${id}`,
  usersBulkUpdate: "/account/users/bulk-update",
  usersBulkDelete: "/account/users/bulk-delete",
} as const;
