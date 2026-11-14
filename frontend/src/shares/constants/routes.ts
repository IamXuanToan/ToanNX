/**
 * Đường dẫn nội bộ của ứng dụng (khóa của `routing.pathnames`).
 * Mọi điều hướng dùng APP_ROUTES; next-intl tự đổi sang URL theo ngôn ngữ
 * (ví dụ `/admin/users` → `/vi/quan-tri/nguoi-dung`).
 */
export const APP_ROUTES = {
  home: "/",
  login: "/login",
  admin: "/admin",
  adminUsers: "/admin/users",
  adminUserDetail: (id: string) => ({ pathname: "/admin/users/[id]" as const, params: { id } }),
  adminRoles: "/admin/roles",
  adminRoleDetail: (id: string) => ({ pathname: "/admin/roles/[id]" as const, params: { id } }),
  adminModules: "/admin/modules",
} as const;

/** Bảng pathname theo ngôn ngữ cho next-intl. */
export const LOCALIZED_PATHNAMES = {
  "/": "/",
  "/login": { vi: "/dang-nhap", en: "/login" },
  "/admin": { vi: "/quan-tri", en: "/admin" },
  "/admin/users": { vi: "/quan-tri/nguoi-dung", en: "/admin/users" },
  "/admin/users/[id]": { vi: "/quan-tri/nguoi-dung/[id]", en: "/admin/users/[id]" },
  "/admin/roles": { vi: "/quan-tri/vai-tro", en: "/admin/roles" },
  "/admin/roles/[id]": { vi: "/quan-tri/vai-tro/[id]", en: "/admin/roles/[id]" },
  "/admin/modules": { vi: "/quan-tri/module", en: "/admin/modules" },
} as const;
