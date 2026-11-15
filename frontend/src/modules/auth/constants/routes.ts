/** Route của module Auth. */
export const AUTH_ROUTES = {
  login: "/login",
  sessions: "/admin/sessions",
} as const;

/** Pathname theo ngôn ngữ của module Auth (gộp vào `routing.pathnames`). */
export const AUTH_PATHNAMES = {
  "/login": { vi: "/dang-nhap", en: "/login" },
  "/admin/sessions": { vi: "/quan-tri/phien", en: "/admin/sessions" },
} as const;
