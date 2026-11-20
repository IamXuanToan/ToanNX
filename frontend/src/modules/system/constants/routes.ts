const SESSIONS_BASE = "/admin/sessions";
const SESSIONS_VI_BASE = "/quan-tri/phien";

/**
 * Route nội bộ của module System: đăng nhập/đặt lại mật khẩu, người dùng, phiên, vai trò, quyền, thư viện và
 * nhật ký. Route động là hàm trả `{ pathname, params }` cho `Link`/`router` của `@/i18n/navigation`.
 */
export const SYSTEM_ROUTES = {
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  users: "/admin/users",
  userCreate: "/admin/users/new",
  userDetail: (id: string) => ({ pathname: "/admin/users/[id]" as const, params: { id } }),
  sessions: SESSIONS_BASE,
  roles: "/admin/roles",
  roleCreate: "/admin/roles/new",
  roleDetail: (id: string) => ({ pathname: "/admin/roles/[id]" as const, params: { id } }),
  permissions: "/admin/permissions",
  library: "/admin/attachments",
  journalEntries: "/admin/journal",
  journalEntryDetail: (id: string) => ({
    pathname: "/admin/journal/[id]" as const,
    params: { id },
  }),
} as const;

/** Pathname theo ngôn ngữ của module System (gộp vào `routing.pathnames`). */
export const SYSTEM_PATHNAMES = {
  "/login": { vi: "/dang-nhap", en: "/login" },
  "/forgot-password": { vi: "/quen-mat-khau", en: "/forgot-password" },
  "/reset-password": { vi: "/dat-lai-mat-khau", en: "/reset-password" },
  "/admin/users": { vi: "/quan-tri/nguoi-dung", en: "/admin/users" },
  "/admin/users/new": { vi: "/quan-tri/nguoi-dung/tao-moi", en: "/admin/users/new" },
  "/admin/users/[id]": { vi: "/quan-tri/nguoi-dung/[id]", en: "/admin/users/[id]" },
  [SESSIONS_BASE]: { vi: SESSIONS_VI_BASE, en: SESSIONS_BASE },
  "/admin/roles": { vi: "/quan-tri/vai-tro", en: "/admin/roles" },
  "/admin/roles/new": { vi: "/quan-tri/vai-tro/tao-moi", en: "/admin/roles/new" },
  "/admin/roles/[id]": { vi: "/quan-tri/vai-tro/[id]", en: "/admin/roles/[id]" },
  "/admin/permissions": { vi: "/quan-tri/quyen", en: "/admin/permissions" },
  "/admin/attachments": { vi: "/quan-tri/thu-vien", en: "/admin/attachments" },
  "/admin/journal": { vi: "/quan-tri/nhat-ky", en: "/admin/journal" },
  "/admin/journal/[id]": { vi: "/quan-tri/nhat-ky/[id]", en: "/admin/journal/[id]" },
} as const;
