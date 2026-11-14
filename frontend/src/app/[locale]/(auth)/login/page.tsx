import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import type { AppLocale } from "@/i18n/routing";
import { LoginView } from "@/modules/auth/views/login-view";
import { buildAlternates } from "@/shares/lib/seo";

/** Metadata trang đăng nhập (không index). */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "auth.login" });
  return {
    title: t("title"),
    robots: { index: false, follow: false },
    alternates: buildAlternates("/login", locale as AppLocale),
  };
}

/**
 * Trang đăng nhập.
 *
 * @param props - Tham số route.
 * @returns LoginView.
 */
export default async function LoginPage({ params }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}
