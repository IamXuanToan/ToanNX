/**
 * Đường dẫn phiên mà chính `apiClient` cần biết: lấy CSRF, silent refresh, và các path
 * không được kích hoạt silent refresh khi nhận 401. Đây là hợp đồng của lớp truyền tải,
 * module `system` dùng lại trong `SYSTEM_API_ENDPOINTS`; không khai endpoint nghiệp vụ ở đây.
 */
export const SESSION_API_PATHS = {
  csrf: "/system/auth/csrf",
  login: "/system/auth/login",
  refresh: "/system/auth/refresh",
  logout: "/system/auth/logout",
} as const;

/** Endpoint không được kích hoạt silent refresh khi nhận 401. */
export const PATHS_WITHOUT_REFRESH: readonly string[] = Object.values(SESSION_API_PATHS);
