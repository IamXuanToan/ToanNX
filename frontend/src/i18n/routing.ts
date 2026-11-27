import { defineRouting } from "next-intl/routing";

import { SYSTEM_PATHNAMES } from "@/modules/system/constants/routes";
import { MANAGE_APP_PATHNAMES } from "@/modules/manage-app/constants/routes";
import { HOME_PATHNAMES } from "@/modules/home/constants/routes";
import { NOVEL_PATHNAMES } from "@/modules/novel/constants/routes";
import { UTILITIES_PATHNAMES } from "@/modules/utilities/constants/routes";
import { FINANCE_PATHNAMES } from "@/modules/finance/constants/routes";
import { PORTAL_PATHNAMES } from "@/modules/portal/constants/routes";
import { WORKSPACE_PATHNAMES } from "@/modules/workspace/constants/routes";

export const LOCALES = ["vi", "en"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "vi";

/** Cấu hình định tuyến đa ngôn ngữ: luôn có tiền tố locale, URL dịch theo ngôn ngữ. */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
  // Mỗi module khai pathname của mình trong `modules/<m>/constants/routes.ts`; ở đây chỉ gộp lại.
  pathnames: {
    ...HOME_PATHNAMES,
    ...SYSTEM_PATHNAMES,
    ...MANAGE_APP_PATHNAMES,
    ...NOVEL_PATHNAMES,
    ...UTILITIES_PATHNAMES,
    ...FINANCE_PATHNAMES,
    ...PORTAL_PATHNAMES,
    ...WORKSPACE_PATHNAMES,
  },
});

export type AppPathname = keyof typeof routing.pathnames;
