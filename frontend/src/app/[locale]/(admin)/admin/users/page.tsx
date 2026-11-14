import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/i18n/routing";

import { UserListView } from "@/modules/account/views/user-list-view";

/** Metadata trang người dùng. */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/users">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "common.nav" });
  return { title: t("users") };
}

/** Trang danh sách người dùng. */
export default function UsersPage() {
  return <UserListView />;
}
