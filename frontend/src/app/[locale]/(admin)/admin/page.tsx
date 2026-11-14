import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/i18n/routing";

import { DashboardView } from "@/modules/dashboard/views/dashboard-view";

/** Metadata trang tổng quan. */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "common.nav" });
  return { title: t("dashboard") };
}

/** Trang tổng quan quản trị. */
export default function AdminDashboardPage() {
  return <DashboardView />;
}
