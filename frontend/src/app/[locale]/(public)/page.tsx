import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { AppLocale } from "@/i18n/routing";
import { LogoMark } from "@/shares/components/layout/logo";
import { buildAlternates } from "@/shares/lib/seo";

/** Metadata trang chủ. */
export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: buildAlternates("/", locale as AppLocale) };
}

/**
 * Trang chủ tạm thời của foundation (giao diện Magic Fantasy làm ở phase sau).
 *
 * @param props - Tham số route.
 * @returns Trang chủ.
 */
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  const t = await getTranslations("common.home");
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <LogoMark className="size-16" title="TOANNX" />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
      <p className="text-muted-foreground max-w-xl">{t("description")}</p>
    </section>
  );
}
