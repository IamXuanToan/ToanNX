import type { Metadata } from "next";

import { getPathname } from "@/i18n/navigation";
import { type AppLocale, type AppPathname, LOCALES } from "@/i18n/routing";
import { env } from "@/shares/config/env";

/**
 * Canonical và hreflang cho một trang (mỗi ngôn ngữ một URL, tránh nội dung trùng lặp).
 *
 * @param href - Đường dẫn nội bộ.
 * @param locale - Ngôn ngữ hiện tại.
 * @returns Metadata `alternates`.
 */
export function buildAlternates(href: AppPathname, locale: AppLocale): Metadata["alternates"] {
  const url = (target: AppLocale) =>
    `${env.siteUrl}${getPathname({ href: href as never, locale: target })}`;
  return {
    canonical: url(locale),
    languages: {
      ...Object.fromEntries(LOCALES.map((item) => [item, url(item)])),
      "x-default": url("vi"),
    },
  };
}
