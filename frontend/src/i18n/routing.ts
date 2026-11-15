import { defineRouting } from "next-intl/routing";

import { ACCOUNT_PATHNAMES } from "@/modules/account/constants/routes";
import { ATTACHMENT_PATHNAMES } from "@/modules/attachment/constants/routes";
import { AUTH_PATHNAMES } from "@/modules/auth/constants/routes";
import { MANAGE_APP_PATHNAMES } from "@/modules/manage-app/constants/routes";
import { HOME_PATHNAMES } from "@/modules/home/constants/routes";
import { IAM_PATHNAMES } from "@/modules/iam/constants/routes";

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
    ...AUTH_PATHNAMES,
    ...MANAGE_APP_PATHNAMES,
    ...ACCOUNT_PATHNAMES,
    ...IAM_PATHNAMES,
    ...ATTACHMENT_PATHNAMES,
  },
});

export type AppPathname = keyof typeof routing.pathnames;
