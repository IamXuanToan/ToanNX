import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/i18n/routing";

import { RoleListView } from "@/modules/iam/views/role-list-view";

/** Metadata trang vai trò. */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/roles">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "common.nav" });
  return { title: t("roles") };
}

/** Trang danh sách vai trò. */
export default function RolesPage() {
  return <RoleListView />;
}
