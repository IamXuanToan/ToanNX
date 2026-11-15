/** Route của module Custom Pages. */
export const CUSTOM_PAGES_ROUTES = {
  pages: "/admin/pages",
  pageCreate: "/admin/pages/new",
  pageDetail: (id: string) => ({ pathname: "/admin/pages/[id]" as const, params: { id } }),
  paths: "/admin/page-paths",
  pathCreate: "/admin/page-paths/new",
  pathDetail: (id: string) => ({ pathname: "/admin/page-paths/[id]" as const, params: { id } }),
} as const;

/**
 * Route nội bộ hiển thị trang công khai. Người xem mở `toannx.com/<segment>/<slug>`; `proxy.ts` rewrite sang đây
 * (Next không cho `[locale]` và `[segment]` cùng cấp nên không đặt trang ở gốc).
 */
export const PUBLIC_PAGE_ROUTE_PREFIX = "page-view";

/** Pathname theo ngôn ngữ của module Custom Pages (gộp vào `routing.pathnames`). */
export const CUSTOM_PAGES_PATHNAMES = {
  "/admin/pages": { vi: "/quan-tri/trang", en: "/admin/pages" },
  "/admin/pages/new": { vi: "/quan-tri/trang/tao-moi", en: "/admin/pages/new" },
  "/admin/pages/[id]": { vi: "/quan-tri/trang/[id]", en: "/admin/pages/[id]" },
  "/admin/page-paths": { vi: "/quan-tri/duong-dan", en: "/admin/page-paths" },
  "/admin/page-paths/new": { vi: "/quan-tri/duong-dan/tao-moi", en: "/admin/page-paths/new" },
  "/admin/page-paths/[id]": { vi: "/quan-tri/duong-dan/[id]", en: "/admin/page-paths/[id]" },
} as const;

/**
 * Đoạn đầu URL không phải trang công khai (khớp BE `PUBLIC_RESERVED_SEGMENTS`). `proxy.ts` chỉ rewrite URL đúng
 * hai đoạn mà đoạn đầu không nằm ở đây.
 */
export const RESERVED_SEGMENTS = new Set([
  "vi",
  "en",
  "api",
  "s",
  "_next",
  "admin",
  "quan-tri",
  "login",
  "dang-nhap",
  "robots",
  "sitemap",
  "icon",
  "media",
  "static",
  "favicon",
  "lien-ket-khong-kha-dung",
  "link-unavailable",
  PUBLIC_PAGE_ROUTE_PREFIX,
]);
