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

/** Tên hàm global `data-before-send` chuẩn Umami v2 để chặn tracking trang nội bộ khi chuyển SPA. */
const BEFORE_SEND_FN_NAME = "umamiBeforeSend";

const BEFORE_SEND_SCRIPT = `
  window.${BEFORE_SEND_FN_NAME} = function(type, payload) {
    var target = (payload && typeof payload === "object") ? payload : (type && typeof type === "object" ? type : null);
    var path = (target && target.url) || window.location.pathname || "";
    var excluded = ${JSON.stringify(ANALYTICS_EXCLUDED_SEGMENTS)};
    for (var i = 0; i < excluded.length; i++) {
      if (path.indexOf(excluded[i]) !== -1) {
        return false;
      }
    }
    return target || payload;
  };
`;

/**
 * Nhúng các công cụ phân tích truy cập và số liệu hiệu năng (Umami Analytics & Vercel Analytics).
 * Chỉ theo dõi các trang công khai; bật Umami khi có `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (để trống ở local nếu muốn tắt).
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
            data-before-send={BEFORE_SEND_FN_NAME}
            strategy="afterInteractive"
          />
        </>
      ) : null}
      {env.isProduction && !isExcluded ? <Analytics /> : null}
    </>
  );
}
