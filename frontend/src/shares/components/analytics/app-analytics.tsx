import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

import { env } from "@/shares/config/env";

/**
 * Nhúng các công cụ phân tích truy cập và số liệu hiệu năng (Umami Analytics & Vercel Analytics).
 *
 * @returns Các script và component phân tích web.
 */
export function AppAnalytics() {
  return (
    <>
      {env.umamiWebsiteId ? (
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id={env.umamiWebsiteId}
          strategy="afterInteractive"
        />
      ) : null}
      <Analytics />
    </>
  );
}
