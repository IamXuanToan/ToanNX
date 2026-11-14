import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Origin của Django API. Chỉ dùng phía server (rewrite), không lộ ra bundle client.
 * Frontend gọi `/api/v1/*` cùng origin → cookie phiên là cookie host-only của toannx.com.
 */
const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
