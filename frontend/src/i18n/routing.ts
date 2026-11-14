import { defineRouting } from "next-intl/routing";

import { LOCALIZED_PATHNAMES } from "@/shares/constants/routes";

export const LOCALES = ["vi", "en"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "vi";

/** Cấu hình định tuyến đa ngôn ngữ: luôn có tiền tố locale, URL dịch theo ngôn ngữ. */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
  pathnames: LOCALIZED_PATHNAMES,
});

export type AppPathname = keyof typeof routing.pathnames;
