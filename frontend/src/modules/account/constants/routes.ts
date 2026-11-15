/** Route của module Account. */
export const ACCOUNT_ROUTES = {
  users: "/admin/users",
  userCreate: "/admin/users/new",
  userDetail: (id: string) => ({ pathname: "/admin/users/[id]" as const, params: { id } }),
} as const;

/** Pathname theo ngôn ngữ của module Account (gộp vào `routing.pathnames`). */
export const ACCOUNT_PATHNAMES = {
  "/admin/users": { vi: "/quan-tri/nguoi-dung", en: "/admin/users" },
  "/admin/users/new": { vi: "/quan-tri/nguoi-dung/tao-moi", en: "/admin/users/new" },
  "/admin/users/[id]": { vi: "/quan-tri/nguoi-dung/[id]", en: "/admin/users/[id]" },
} as const;
