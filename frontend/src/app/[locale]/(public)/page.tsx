import { setRequestLocale } from "next-intl/server";

import type { AppLocale } from "@/i18n/routing";
import { HomeView } from "@/modules/home/views/home-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ alternates: "/" });

/**
 * Trang chủ.
 *
 * @param props - Tham số route.
 * @returns HomeView.
 */
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  setRequestLocale((await params).locale as AppLocale);
  return <HomeView />;
}
