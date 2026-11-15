/** Route của module IAM. */
export const IAM_ROUTES = {
  roles: "/admin/roles",
  permissions: "/admin/permissions",
  roleCreate: "/admin/roles/new",
  roleDetail: (id: string) => ({ pathname: "/admin/roles/[id]" as const, params: { id } }),
} as const;

/** Pathname theo ngôn ngữ của module IAM (gộp vào `routing.pathnames`). */
export const IAM_PATHNAMES = {
  "/admin/roles": { vi: "/quan-tri/vai-tro", en: "/admin/roles" },
  "/admin/permissions": { vi: "/quan-tri/quyen", en: "/admin/permissions" },
  "/admin/roles/new": { vi: "/quan-tri/vai-tro/tao-moi", en: "/admin/roles/new" },
  "/admin/roles/[id]": { vi: "/quan-tri/vai-tro/[id]", en: "/admin/roles/[id]" },
} as const;
