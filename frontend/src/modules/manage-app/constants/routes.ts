/** Route của module Manage App (khu vực quản trị: màn chọn module). */
export const MANAGE_APP_ROUTES = {
  admin: "/admin",
} as const;

/** Pathname theo ngôn ngữ của module Manage App (gộp vào `routing.pathnames`). */
export const MANAGE_APP_PATHNAMES = {
  "/admin": { vi: "/quan-tri", en: "/admin" },
} as const;
