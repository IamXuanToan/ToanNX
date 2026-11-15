import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

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

type PageMetadataOptions = {
  /** Khóa tiêu đề dạng `<namespace>.<key>` (ví dụ `common.nav.users`); bỏ trống = tiêu đề mặc định. */
  title?: string;
  /** `false` để chặn index (trang đăng nhập, quản trị). */
  index?: boolean;
  /** Đường dẫn nội bộ để sinh canonical + hreflang. */
  alternates?: AppPathname;
};

/**
 * Tạo `generateMetadata` cho một page, để `page.tsx` chỉ khai báo, không tự viết logic.
 *
 * @param options - Khóa tiêu đề, cờ index, đường dẫn alternates.
 * @returns Hàm `generateMetadata` của Next.js.
 */
export function createPageMetadata(options: PageMetadataOptions) {
  return async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
    const { locale } = await params;
    const metadata: Metadata = {};
    if (options.title) {
      const separator = options.title.lastIndexOf(".");
      const t = await getTranslations({
        locale: locale as AppLocale,
        namespace: options.title.slice(0, separator) as never,
      });
      metadata.title = t(options.title.slice(separator + 1) as never);
    }
    if (options.index === false) metadata.robots = { index: false, follow: false };
    if (options.alternates) {
      metadata.alternates = buildAlternates(options.alternates, locale as AppLocale);
    }
    return metadata;
  };
}
