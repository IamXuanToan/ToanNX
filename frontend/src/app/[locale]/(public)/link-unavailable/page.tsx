import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { HOME_ROUTES } from "@/modules/home/constants/routes";
import { LinkUnavailableView } from "@/modules/utilities/views/short-link/link-unavailable-view";
import { Button } from "@/shares/components/ui/button";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "utilities.nav.shortLinks",
  index: false,
});

/**
 * Trang thông báo khi `/s/{slug}` không chuyển hướng được.
 *
 * @param props - Tham số route và `?reason=`.
 * @returns LinkUnavailableView.
 */
export default async function LinkUnavailablePage({
  params,
  searchParams,
}: PageProps<"/[locale]/link-unavailable">) {
  const locale = (await params).locale as AppLocale;
  const { reason } = await searchParams;
  const t = await getTranslations({ locale, namespace: "utilities.shortLinks.unavailable" });
  return (
    <LinkUnavailableView
      reason={typeof reason === "string" ? reason : undefined}
      action={
        <Button asChild variant="outline">
          <Link href={HOME_ROUTES.home}>{t("home")}</Link>
        </Button>
      }
    />
  );
}
