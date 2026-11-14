import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";
import { APP_ROUTES } from "@/shares/constants/routes";

import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { ThemeSwitcher } from "./theme-switcher";

/**
 * Header của khu vực công khai.
 *
 * @returns Header.
 */
export function PublicHeader() {
  const t = useTranslations("common.nav");
  return (
    <header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href={APP_ROUTES.home} aria-label="TOANNX">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <Button asChild variant="outline" size="sm" className="ml-1">
            <Link href={APP_ROUTES.login}>{t("login")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
