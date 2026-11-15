/** Endpoint API của module IAM (tương đối với `env.apiBasePath`). */
export const IAM_API_ENDPOINTS = {
  roles: "/iam/roles",
  role: (id: string) => `/iam/roles/${id}`,
  rolesBulkUpdate: "/iam/roles/bulk-update",
  rolesBulkDelete: "/iam/roles/bulk-delete",
  rolePermissions: (roleId: string) => `/iam/roles/${roleId}/permissions`,
  rolePermission: (roleId: string, permissionId: string) =>
    `/iam/roles/${roleId}/permissions/${permissionId}`,
  permissions: "/iam/permissions",
  userRoles: (userId: string) => `/iam/users/${userId}/roles`,
  userRole: (userId: string, roleId: string) => `/iam/users/${userId}/roles/${roleId}`,
} as const;
