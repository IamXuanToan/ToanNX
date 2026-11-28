import "../globals.css";

import type { Metadata } from "next";
import {
  Be_Vietnam_Pro,
  Inter,
  JetBrains_Mono,
  Playfair_Display,
  Plus_Jakarta_Sans,
} from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";

import { type AppLocale, routing } from "@/i18n/routing";
import { AppAnalytics } from "@/shares/components/analytics/app-analytics";
import { AppProviders } from "@/shares/components/providers/app-providers";
import { env } from "@/shares/config/env";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-sans", display: "swap" });
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-plus-jakarta",
  display: "swap",
});
const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const FONT_VARIABLES = [
  inter.variable,
  plusJakarta.variable,
  beVietnam.variable,
  playfair.variable,
  jetbrainsMono.variable,
].join(" ");

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
    title: { default: t("title"), template: `%s · ToanNX` },
    description: t("description"),
    applicationName: "ToanNX",
    openGraph: { siteName: "ToanNX", locale, type: "website" },
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

  return (
    <html lang={locale} suppressHydrationWarning className={FONT_VARIABLES}>
      <body className="min-h-svh font-sans antialiased">
        <NextIntlClientProvider>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
        <AppAnalytics />
      </body>
    </html>
  );
}
