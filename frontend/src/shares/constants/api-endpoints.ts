/** Đường dẫn API (tương đối với `env.apiBasePath`). Không hardcode path trong component. */
export const API_ENDPOINTS = {
  auth: {
    csrf: "/auth/csrf",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    logoutAll: "/auth/logout-all",
    me: "/auth/me",
    sessions: "/auth/sessions",
  },
  account: {
    users: "/account/users",
    user: (id: string) => `/account/users/${id}`,
  },
  iam: {
    userRoles: (id: string) => `/iam/users/${id}/roles`,
    userRole: (id: string, roleId: string) => `/iam/users/${id}/roles/${roleId}`,
    roles: "/iam/roles",
    role: (id: string) => `/iam/roles/${id}`,
    rolePermissions: (id: string) => `/iam/roles/${id}/permissions`,
    rolePermission: (id: string, permissionId: string) =>
      `/iam/roles/${id}/permissions/${permissionId}`,
    permissions: "/iam/permissions",
  },
  attachment: {
    list: "/attachments",
    detail: (id: string) => `/attachments/${id}`,
  },
  system: {
    modules: "/system/modules",
    module: (code: string) => `/system/modules/${code}`,
  },
} as const;

/** Endpoint không được kích hoạt silent refresh khi nhận 401. */
export const AUTH_ENDPOINTS_WITHOUT_REFRESH: readonly string[] = [
  API_ENDPOINTS.auth.login,
  API_ENDPOINTS.auth.refresh,
  API_ENDPOINTS.auth.logout,
  API_ENDPOINTS.auth.csrf,
];
