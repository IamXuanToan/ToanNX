import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Origin của Django API từ NEXT_PUBLIC_API_URL.
 */
const apiOrigin = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001").replace(/\/$/, "");
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
  `script-src 'self' 'unsafe-inline' https://cloud.umami.is https://static.cloudflareinsights.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' https: data: blob:${isDev ? " http:" : ""}`,
  "media-src 'self' https: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin} https://api.open-meteo.com https://fcmregistrations.googleapis.com https://firebaseinstallations.googleapis.com https://cloud.umami.is https://gateway.umami.is https://cloudflareinsights.com`,
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
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
      {
        protocol: "https",
        hostname: "img.vietqr.io",
      },
      {
        protocol: "https",
        hostname: "media.toannx.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "www.google.com",
      },
      {
        protocol: "https",
        hostname: "**.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "icons.duckduckgo.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8001",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8001",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
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
      // File upload khi dùng storage local của Django (production dùng URL object storage).
      { source: "/media/:path*", destination: `${apiOrigin}/media/:path*` },
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
