import { getTranslations } from "next-intl/server";

import { LogoMark } from "@/shares/components/layout/logo";

/**
 * Trang chủ tạm thời của foundation (giao diện Magic Fantasy làm ở phase sau).
 *
 * @returns Trang chủ.
 */
export async function HomeView() {
  const t = await getTranslations("common.home");
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <LogoMark className="size-16" title="TOANNX" />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
      <p className="text-muted-foreground max-w-xl">{t("description")}</p>
    </section>
  );
}
