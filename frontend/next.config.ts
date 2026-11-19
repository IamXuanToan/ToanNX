import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Origin của Django API. Chỉ dùng phía server (rewrite), không lộ ra bundle client.
 * Frontend gọi `/api/v1/*` cùng origin → cookie phiên là cookie host-only của toannx.com.
 */
const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://localhost:8000";
const isDev = process.env.NODE_ENV === "development";
const isHttps = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");

/**
 * Content Security Policy không dùng nonce (giữ được trang tĩnh, xem `content-security-policy.md` của Next):
 * chỉ script/style cùng origin (kèm inline do Next sinh), ảnh cùng origin + `https:` (object storage) + data/blob
 * (xem trước QR, ảnh chọn từ máy), iframe chỉ YouTube (node video của Tiptap), cấm `object`, nhúng trang,
 * đổi `base` và gửi form ra ngoài. Dev cần `unsafe-eval` cho React; HTTPS thì nâng mọi request lên HTTPS.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data: blob:",
  "media-src 'self' https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.open-meteo.com",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  // E2E build vào thư mục riêng (`NEXT_DIST_DIR=.next-e2e`) để không ghi đè bản build thường.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.toannx.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${backendOrigin}/api/v1/:path*` },
      // File upload khi dùng storage local của Django (production dùng URL object storage).
      { source: "/media/:path*", destination: `${backendOrigin}/media/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
