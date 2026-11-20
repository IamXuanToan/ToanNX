/** Endpoint API của module Tiện ích (tương đối với `env.apiBasePath`, khớp `/api/v1/utilities/...` ở BE). */
export const UTILITIES_API_ENDPOINTS = {
  shortLinks: "/utilities/short-links",
  /**
   * Trang trung gian công khai của link rút gọn.
   *
   * @param slug - Slug của link.
   * @returns Path resolve đã mã hóa slug.
   */
  shortLinkResolve: (slug: string) => `/utilities/short-links/resolve/${encodeURIComponent(slug)}`,
  qrCodes: "/utilities/qr-codes",
  qrCodePreview: "/utilities/qr-codes/preview",
  qrCodeBanks: "/utilities/qr-codes/banks",
  pagePaths: "/utilities/page-paths",
  pages: "/utilities/pages",
  /**
   * Nội dung trang công khai `/<segment>/<slug>`.
   *
   * @param segment - Đường dẫn giữa.
   * @param slug - Slug của trang.
   * @returns Path đã mã hóa từng đoạn.
   */
  pagePublic: (segment: string, slug: string) =>
    `/utilities/pages/public/${encodeURIComponent(segment)}/${encodeURIComponent(slug)}`,
} as const;
