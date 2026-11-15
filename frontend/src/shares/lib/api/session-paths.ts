/**
 * Đường dẫn phiên mà chính `apiClient` cần biết: lấy CSRF, silent refresh, và các path
 * không được kích hoạt silent refresh khi nhận 401. Đây là hợp đồng của lớp truyền tải,
 * module `auth` dùng lại trong `api-endpoints.ts` của nó; không khai endpoint nghiệp vụ ở đây.
 */
export const SESSION_API_PATHS = {
  csrf: "/auth/csrf",
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
} as const;

/** Endpoint không được kích hoạt silent refresh khi nhận 401. */
export const PATHS_WITHOUT_REFRESH: readonly string[] = Object.values(SESSION_API_PATHS);
