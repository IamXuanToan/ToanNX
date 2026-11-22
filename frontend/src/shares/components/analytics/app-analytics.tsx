"use client";

import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";

import { env } from "@/shares/config/env";

/** Kiểm tra xem đường dẫn có thuộc khu vực quản trị hoặc nội bộ không. */
function isExcludedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.includes("/quan-tri") ||
    pathname.includes("/admin") ||
    pathname.includes("/dang-nhap") ||
    pathname.includes("/login") ||
    pathname.includes("/xac-thuc") ||
    pathname.includes("/verify")
  );
}

/** Cấu hình chặn tracking các trang quản trị ngay cả khi SPA chuyển trang. */
const BEFORE_SEND_SCRIPT = `
  window.umamiConfig = window.umamiConfig || {};
  window.umamiConfig.beforeSend = function(payload) {
    var path = payload.url || window.location.pathname;
    if (
      path.indexOf('/quan-tri') !== -1 ||
      path.indexOf('/admin') !== -1 ||
      path.indexOf('/dang-nhap') !== -1 ||
      path.indexOf('/login') !== -1 ||
      path.indexOf('/xac-thuc') !== -1 ||
      path.indexOf('/verify') !== -1
    ) {
      return false;
    }
    return payload;
  };
`;

/**
 * Nhúng các công cụ phân tích truy cập và số liệu hiệu năng (Umami Analytics & Vercel Analytics).
 * Chỉ theo dõi các trang công khai (trang chủ, liên kết rút gọn, trang tùy chỉnh); không theo dõi trang quản trị.
 *
 * @returns Các script và component phân tích web.
 */
export function AppAnalytics() {
  const pathname = usePathname();
  const isExcluded = isExcludedPath(pathname);

  return (
    <>
      {env.umamiWebsiteId && !isExcluded ? (
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
      <Analytics />
    </>
  );
}
