"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";
import { LanguageSwitcher } from "@/shares/components/layout/language-switcher";
import { Logo } from "@/shares/components/layout/logo";
import { ThemeSwitcher } from "@/shares/components/layout/theme-switcher";
import { AUTH_ROUTES } from "@/modules/auth/constants/routes";

import { HOME_ROUTES } from "../../constants/routes";

/**
 * Header của khu vực công khai.
 * Trên trang Home: trong suốt, không viền và không hiện nút Đăng nhập để tối ưu hóa không gian 3D.
 *
 * @returns Header.
 */
export function PublicHeader() {
  const t = useTranslations("common.nav");
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      className={
        isHome
          ? "fixed inset-x-0 top-0 z-30 border-none bg-transparent"
          : "bg-background/80 sticky top-0 z-30 border-b backdrop-blur"
      }
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href={HOME_ROUTES.home} aria-label="TOANNX">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {!isHome ? <ThemeSwitcher /> : null}
          {!isHome ? (
            <Button asChild variant="outline" className="ml-1">
              <Link href={AUTH_ROUTES.login}>{t("login")}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
