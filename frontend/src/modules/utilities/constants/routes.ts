import type { DemoTemplateTypeValue } from "./page-constants";

/**
 * Route nội bộ của module Tiện ích (link rút gọn, mã QR, trang, đường dẫn giữa).
 * Route động là hàm trả `{ pathname, params }` cho `Link`/`router` của `@/i18n/navigation`.
 */
export const UTILITIES_ROUTES = {
  dashboard: "/admin/utilities",
  donations: "/admin/donations",
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
  /** Trang xem trước trực tiếp các mẫu template công khai. */
  demo: "/demo",
  /** Trang demo trình soạn thảo Notion-like mới. */
  demoEditor: "/demo/editor",
  demoType: (type: DemoTemplateTypeValue) => ({
    pathname: "/demo/[type]" as const,
    params: { type },
  }),
} as const;

/**
 * Route nội bộ hiển thị trang công khai. Người xem mở `toannx.com/<segment>/<slug>`; `proxy.ts` rewrite sang đây
 * (Next không cho `[locale]` và `[segment]` cùng cấp nên không đặt trang ở gốc).
 */
export const PUBLIC_PAGE_ROUTE_PREFIX = "page-view";

/** Pathname theo ngôn ngữ của module Tiện ích (gộp vào `routing.pathnames`). */
export const UTILITIES_PATHNAMES = {
  "/admin/utilities": {
    vi: "/quan-tri/tien-ich",
    en: "/admin/utilities",
  },
  "/admin/donations": {
    vi: "/quan-tri/tien-ich/quyen-gop",
    en: "/admin/utilities/donations",
  },
  "/admin/short-links": {
    vi: "/quan-tri/tien-ich/link-rut-gon",
    en: "/admin/utilities/short-links",
  },
  "/admin/short-links/new": {
    vi: "/quan-tri/tien-ich/link-rut-gon/tao-moi",
    en: "/admin/utilities/short-links/new",
  },
  "/admin/short-links/[id]": {
    vi: "/quan-tri/tien-ich/link-rut-gon/[id]",
    en: "/admin/utilities/short-links/[id]",
  },
  "/link-unavailable": { vi: "/lien-ket-khong-kha-dung", en: "/link-unavailable" },
  "/admin/qr-codes": { vi: "/quan-tri/tien-ich/ma-qr", en: "/admin/utilities/qr-codes" },
  "/admin/qr-codes/new": {
    vi: "/quan-tri/tien-ich/ma-qr/tao-moi",
    en: "/admin/utilities/qr-codes/new",
  },
  "/admin/qr-codes/[id]": {
    vi: "/quan-tri/tien-ich/ma-qr/[id]",
    en: "/admin/utilities/qr-codes/[id]",
  },
  "/admin/pages": { vi: "/quan-tri/tien-ich/trang", en: "/admin/utilities/pages" },
  "/admin/pages/new": { vi: "/quan-tri/tien-ich/trang/tao-moi", en: "/admin/utilities/pages/new" },
  "/admin/pages/[id]": { vi: "/quan-tri/tien-ich/trang/[id]", en: "/admin/utilities/pages/[id]" },
  "/admin/page-paths": { vi: "/quan-tri/tien-ich/duong-dan", en: "/admin/utilities/page-paths" },
  "/admin/page-paths/new": {
    vi: "/quan-tri/tien-ich/duong-dan/tao-moi",
    en: "/admin/utilities/page-paths/new",
  },
  "/admin/page-paths/[id]": {
    vi: "/quan-tri/tien-ich/duong-dan/[id]",
    en: "/admin/utilities/page-paths/[id]",
  },
  "/demo": { vi: "/demo", en: "/demo" },
  "/demo/editor": { vi: "/demo/editor", en: "/demo/editor" },
  "/demo/[type]": { vi: "/demo/[type]", en: "/demo/[type]" },
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
  "demo",
  "portal",
  "ca-nhan",
  PUBLIC_PAGE_ROUTE_PREFIX,
]);
