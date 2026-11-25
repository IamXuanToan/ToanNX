"use client";

import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";

import { env } from "@/shares/config/env";

const ANALYTICS_EXCLUDED_SEGMENTS = [
  "/quan-tri",
  "/admin",
  "/ca-nhan",
  "/portal",
  "/dang-nhap",
  "/login",
  "/xac-thuc",
  "/verify",
] as const;

/** Kiểm tra xem đường dẫn có thuộc khu vực quản trị, portal cá nhân hoặc xác thực không. */
function isExcludedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return ANALYTICS_EXCLUDED_SEGMENTS.some((segment) => pathname.includes(segment));
}

/** Cấu hình chặn tracking các trang quản trị ngay cả khi SPA chuyển trang. */
const BEFORE_SEND_SCRIPT = `
  window.umamiConfig = window.umamiConfig || {};
  window.umamiConfig.beforeSend = function(payload) {
    var path = payload.url || window.location.pathname;
    var excluded = ${JSON.stringify(ANALYTICS_EXCLUDED_SEGMENTS)};
    for (var i = 0; i < excluded.length; i++) {
      if (path.indexOf(excluded[i]) !== -1) {
        return false;
      }
    }
    return payload;
  };
`;

/**
 * Nhúng các công cụ phân tích truy cập và số liệu hiệu năng (Umami Analytics & Vercel Analytics).
 * Chỉ theo dõi các trang công khai trong production; không tải script analytics ở môi trường dev hoặc trang nội bộ.
 *
 * @returns Các script và component phân tích web.
 */
export function AppAnalytics() {
  const pathname = usePathname();
  const isExcluded = isExcludedPath(pathname);

  return (
    <>
      {env.isProduction && env.umamiWebsiteId && !isExcluded ? (
        <>
          <script dangerouslySetInnerHTML={{ __html: BEFORE_SEND_SCRIPT }} />
          <Script
            defer
            src="https://cloud.umami.is/script.js"
            data-website-id={env.umamiWebsiteId}
            strategy="afterInteractive"
          />
        </>
      ) : null}
      {env.isProduction && !isExcluded ? <Analytics /> : null}
    </>
  );
}
