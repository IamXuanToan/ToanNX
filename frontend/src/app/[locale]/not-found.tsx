import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { LogoMark } from "@/shares/components/layout/logo";
import { Button } from "@/shares/components/ui/button";
import { APP_ROUTES } from "@/shares/constants/routes";

/** Trang 404 theo ngôn ngữ. */
export default function NotFound() {
  const t = useTranslations("errors.notFound");
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <LogoMark className="size-12" />
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground max-w-md text-sm">{t("description")}</p>
      <Button asChild variant="outline">
        <Link href={APP_ROUTES.home}>{t("backHome")}</Link>
      </Button>
    </main>
  );
}
