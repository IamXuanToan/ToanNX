/** Cấu hình runtime phía client (chỉ biến NEXT_PUBLIC_*). */
export const env = {
  /** URL công khai của site, dùng cho canonical/hreflang/sitemap. */
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  /** Tiền tố API cùng origin (Next.js rewrite sang Django). */
  apiBasePath: "/api/v1",
  /** Thời gian chờ tối đa của một request API (ms). */
  apiTimeoutMs: 15_000,
} as const;
