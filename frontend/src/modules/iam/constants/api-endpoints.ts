/** Endpoint API của module IAM (tương đối với `env.apiBasePath`). */
export const IAM_API_ENDPOINTS = {
  roles: "/iam/roles",
  rolePermissions: (roleId: string) => `/iam/roles/${roleId}/permissions`,
  permissions: "/iam/permissions",
  userRoles: (userId: string) => `/iam/users/${userId}/roles`,
} as const;
