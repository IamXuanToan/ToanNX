import type { MetadataRoute } from "next";

import { env } from "@/shares/config/env";

/** robots.txt: chặn khu vực quản trị, đăng nhập và API. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/vi/quan-tri", "/en/admin", "/vi/dang-nhap", "/en/login"],
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
