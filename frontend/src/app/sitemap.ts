import type { MetadataRoute } from "next";

import { getPathname } from "@/i18n/navigation";
import { type AppPathname, LOCALES } from "@/i18n/routing";
import { env } from "@/shares/config/env";

/** Trang công khai được index (không gồm quản trị/đăng nhập). */
const PUBLIC_PATHS: AppPathname[] = ["/"];

/** Sitemap đa ngôn ngữ có hreflang. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.flatMap((href) => {
    const languages = Object.fromEntries(
      LOCALES.map((locale) => [
        locale,
        `${env.siteUrl}${getPathname({ href: href as never, locale })}`,
      ]),
    );
    return LOCALES.map((locale) => ({ url: languages[locale], alternates: { languages } }));
  });
}
