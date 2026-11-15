import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import type { AppLocale } from "@/i18n/routing";
import { LoginView } from "@/modules/auth/views/login-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "auth.login.title",
  index: false,
  alternates: "/login",
});

/**
 * Trang đăng nhập.
 *
 * @param props - Tham số route.
 * @returns LoginView.
 */
export default async function LoginPage({ params }: PageProps<"/[locale]/login">) {
  setRequestLocale((await params).locale as AppLocale);
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}
