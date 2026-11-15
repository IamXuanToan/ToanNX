import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";
import { LanguageSwitcher } from "@/shares/components/layout/language-switcher";
import { Logo } from "@/shares/components/layout/logo";
import { ThemeSwitcher } from "@/shares/components/layout/theme-switcher";
import { AUTH_ROUTES } from "@/modules/auth/constants/routes";

import { HOME_ROUTES } from "../../constants/routes";

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
        <Link href={HOME_ROUTES.home} aria-label="TOANNX">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <Button asChild variant="outline" className="ml-1">
            <Link href={AUTH_ROUTES.login}>{t("login")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
