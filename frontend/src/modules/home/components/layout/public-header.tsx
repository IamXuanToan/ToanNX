"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";
import { LanguageSwitcher } from "@/shares/components/layout/language-switcher";
import { Logo } from "@/shares/components/layout/logo";
import { ThemeSwitcher } from "@/shares/components/layout/theme-switcher";
import { SYSTEM_ROUTES } from "@/modules/system/constants/routes";

import { HOME_ROUTES } from "../../constants/routes";

/**
 * Header của khu vực công khai.
 * Trên trang Home: trong suốt, chỉ hiển thị duy nhất nút chuyển đổi ngôn ngữ.
 * Nút chuyển ngôn ngữ được bo viền kính mờ để hiển thị rõ ràng trên mọi điều kiện nền sáng/tối.
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
        <Link
          href={HOME_ROUTES.home}
          aria-label="ToanNX"
          className={
            isHome
              ? "border-border/40 bg-background/60 hover:bg-background/80 flex items-center rounded-full border px-3.5 py-1.5 shadow-xs backdrop-blur-md transition-all"
              : undefined
          }
        >
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher
            className={
              isHome
                ? "border-border/40 bg-background/60 hover:bg-background/80 rounded-full border shadow-xs backdrop-blur-md"
                : undefined
            }
          />
          {!isHome ? <ThemeSwitcher /> : null}
          {!isHome ? (
            <Button asChild variant="outline" className="ml-1">
              <Link href={SYSTEM_ROUTES.login}>{t("login")}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
