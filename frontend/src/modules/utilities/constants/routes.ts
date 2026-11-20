/**
 * Route nội bộ của module Tiện ích (link rút gọn, mã QR, trang, đường dẫn giữa).
 * Route động là hàm trả `{ pathname, params }` cho `Link`/`router` của `@/i18n/navigation`.
 */
export const UTILITIES_ROUTES = {
  shortLinks: "/admin/short-links",
  shortLinkCreate: "/admin/short-links/new",
  shortLinkDetail: (id: string) => ({
    pathname: "/admin/short-links/[id]" as const,
    params: { id },
  }),
  /** Trang thông báo khi `/s/{slug}` không chuyển hướng được (`?reason=not-found|expired|busy`). */
  linkUnavailable: "/link-unavailable",
  qrCodes: "/admin/qr-codes",
  qrCodeCreate: "/admin/qr-codes/new",
  qrCodeDetail: (id: string) => ({ pathname: "/admin/qr-codes/[id]" as const, params: { id } }),
  pages: "/admin/pages",
  pageCreate: "/admin/pages/new",
  pageDetail: (id: string) => ({ pathname: "/admin/pages/[id]" as const, params: { id } }),
  pagePaths: "/admin/page-paths",
  pagePathCreate: "/admin/page-paths/new",
  pagePathDetail: (id: string) => ({
    pathname: "/admin/page-paths/[id]" as const,
    params: { id },
  }),
} as const;

/**
 * Route nội bộ hiển thị trang công khai. Người xem mở `toannx.com/<segment>/<slug>`; `proxy.ts` rewrite sang đây
 * (Next không cho `[locale]` và `[segment]` cùng cấp nên không đặt trang ở gốc).
 */
export const PUBLIC_PAGE_ROUTE_PREFIX = "page-view";

/** Pathname theo ngôn ngữ của module Tiện ích (gộp vào `routing.pathnames`). */
export const UTILITIES_PATHNAMES = {
  "/admin/short-links": { vi: "/quan-tri/link-rut-gon", en: "/admin/short-links" },
  "/admin/short-links/new": { vi: "/quan-tri/link-rut-gon/tao-moi", en: "/admin/short-links/new" },
  "/admin/short-links/[id]": { vi: "/quan-tri/link-rut-gon/[id]", en: "/admin/short-links/[id]" },
  "/link-unavailable": { vi: "/lien-ket-khong-kha-dung", en: "/link-unavailable" },
  "/admin/qr-codes": { vi: "/quan-tri/ma-qr", en: "/admin/qr-codes" },
  "/admin/qr-codes/new": { vi: "/quan-tri/ma-qr/tao-moi", en: "/admin/qr-codes/new" },
  "/admin/qr-codes/[id]": { vi: "/quan-tri/ma-qr/[id]", en: "/admin/qr-codes/[id]" },
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
