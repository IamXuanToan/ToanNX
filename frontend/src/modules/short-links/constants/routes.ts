/** Route của module Short Links. */
export const SHORT_LINKS_ROUTES = {
  links: "/admin/short-links",
  linkCreate: "/admin/short-links/new",
  linkDetail: (id: string) => ({ pathname: "/admin/short-links/[id]" as const, params: { id } }),
  /** Trang thông báo khi `/s/{slug}` không chuyển hướng được (`?reason=not-found|expired|busy`). */
  unavailable: "/link-unavailable",
} as const;

/** Pathname theo ngôn ngữ của module Short Links (gộp vào `routing.pathnames`). */
export const SHORT_LINKS_PATHNAMES = {
  "/admin/short-links": { vi: "/quan-tri/link-rut-gon", en: "/admin/short-links" },
  "/admin/short-links/new": { vi: "/quan-tri/link-rut-gon/tao-moi", en: "/admin/short-links/new" },
  "/admin/short-links/[id]": { vi: "/quan-tri/link-rut-gon/[id]", en: "/admin/short-links/[id]" },
  "/link-unavailable": { vi: "/lien-ket-khong-kha-dung", en: "/link-unavailable" },
} as const;
