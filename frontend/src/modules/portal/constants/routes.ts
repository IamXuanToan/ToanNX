/**
 * Route nội bộ của Client Portal (Không gian thành viên / Studio cá nhân).
 * Route động là hàm trả `{ pathname, params }` cho `Link`/`router` của `@/i18n/navigation`.
 */
export const PORTAL_ROUTES = {
  dashboard: "/portal",
  pages: "/portal/pages",
  pageCreate: "/portal/pages/new",
  pageDetail: (id: string) => ({
    pathname: "/portal/pages/[id]" as const,
    params: { id },
  }),
  shortLinks: "/portal/short-links",
  shortLinkCreate: "/portal/short-links/new",
  shortLinkDetail: (id: string) => ({
    pathname: "/portal/short-links/[id]" as const,
    params: { id },
  }),
  qrCodes: "/portal/qr-codes",
  qrCodeCreate: "/portal/qr-codes/new",
  qrCodeDetail: (id: string) => ({
    pathname: "/portal/qr-codes/[id]" as const,
    params: { id },
  }),
  library: "/portal/library",
  files: "/portal/library",
  profile: "/portal/profile",
} as const;

/** Pathname theo ngôn ngữ của Client Portal (gộp vào `routing.pathnames`). */
export const PORTAL_PATHNAMES = {
  "/portal": {
    vi: "/ca-nhan",
    en: "/portal",
  },
  "/portal/pages": {
    vi: "/ca-nhan/trang",
    en: "/portal/pages",
  },
  "/portal/pages/new": {
    vi: "/ca-nhan/trang/tao-moi",
    en: "/portal/pages/new",
  },
  "/portal/pages/[id]": {
    vi: "/ca-nhan/trang/[id]",
    en: "/portal/pages/[id]",
  },
  "/portal/short-links": {
    vi: "/ca-nhan/link-rut-gon",
    en: "/portal/short-links",
  },
  "/portal/short-links/new": {
    vi: "/ca-nhan/link-rut-gon/tao-moi",
    en: "/portal/short-links/new",
  },
  "/portal/short-links/[id]": {
    vi: "/ca-nhan/link-rut-gon/[id]",
    en: "/portal/short-links/[id]",
  },
  "/portal/qr-codes": {
    vi: "/ca-nhan/ma-qr",
    en: "/portal/qr-codes",
  },
  "/portal/qr-codes/new": {
    vi: "/ca-nhan/ma-qr/tao-moi",
    en: "/portal/qr-codes/new",
  },
  "/portal/qr-codes/[id]": {
    vi: "/ca-nhan/ma-qr/[id]",
    en: "/portal/qr-codes/[id]",
  },
  "/portal/library": {
    vi: "/ca-nhan/thu-vien",
    en: "/portal/library",
  },
  "/portal/files": {
    vi: "/ca-nhan/thu-vien",
    en: "/portal/library",
  },
  "/portal/profile": {
    vi: "/ca-nhan/ho-so",
    en: "/portal/profile",
  },
} as const;
