import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/i18n/routing";

import { ModuleListView } from "@/modules/system/views/module-list-view";

/** Metadata trang module. */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/modules">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "common.nav" });
  return { title: t("modules") };
}

/** Trang quản lý module. */
export default function ModulesPage() {
  return <ModuleListView />;
}
