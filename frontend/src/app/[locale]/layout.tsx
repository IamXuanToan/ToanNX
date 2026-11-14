import "../globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { type AppLocale, routing } from "@/i18n/routing";
import { AppProviders } from "@/shares/components/providers/app-providers";
import { env } from "@/shares/config/env";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-sans", display: "swap" });

/** Sinh sẵn route cho mọi ngôn ngữ. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Metadata mặc định theo ngôn ngữ. */
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "common.seo" });
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: t("title"), template: `%s · TOANNX` },
    description: t("description"),
    applicationName: "TOANNX",
    openGraph: { siteName: "TOANNX", locale, type: "website" },
  };
}

/**
 * Layout gốc theo ngôn ngữ.
 *
 * @param props - Nội dung con và tham số locale.
 * @returns HTML gốc.
 */
export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning className={inter.variable}>
      <body className="min-h-svh font-sans antialiased">
        <NextIntlClientProvider>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
