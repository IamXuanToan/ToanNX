const SESSIONS_BASE = "/admin/sessions";
const SESSIONS_VI_BASE = "/quan-tri/phien";

/** Route của module Auth. */
export const AUTH_ROUTES = {
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  sessions: SESSIONS_BASE,
} as const;

/** Pathname theo ngôn ngữ của module Auth (gộp vào `routing.pathnames`). */
export const AUTH_PATHNAMES = {
  "/login": { vi: "/dang-nhap", en: "/login" },
  "/forgot-password": { vi: "/quen-mat-khau", en: "/forgot-password" },
  "/reset-password": { vi: "/dat-lai-mat-khau", en: "/reset-password" },
  [SESSIONS_BASE]: { vi: SESSIONS_VI_BASE, en: SESSIONS_BASE },
} as const;
