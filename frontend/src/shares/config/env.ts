/** Cấu hình runtime phía client (chỉ biến NEXT_PUBLIC_*). */
export const env = {
  /** URL công khai của site, dùng cho canonical/hreflang/sitemap. */
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001").replace(/\/$/, ""),
  /** Tiền tố API cùng origin (Next.js rewrite sang Django). */
  apiBasePath: "/api/v1",
  /** Thời gian chờ tối đa của một request API (ms). */
  apiTimeoutMs: 15_000,
  /** Thời gian chờ của upload file (file tới 5 MB trên mạng chậm). */
  uploadTimeoutMs: 60_000,
  /** Cấu hình web Firebase (công khai); thiếu `firebaseProjectId` thì tắt thông báo trình duyệt. */
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  firebaseMessagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  firebaseVapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "",
  /** Mã định danh website Umami Analytics (công khai). Để trống nếu không dùng. */
  umamiWebsiteId:
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? "90bcae66-8550-4461-a6fb-6b00f4b4dd7c",
} as const;
