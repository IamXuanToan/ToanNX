"use client";

import { Languages } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_COOKIE } from "@/i18n/request-locale";
import { type AppLocale, LOCALES } from "@/i18n/routing";
import { Button } from "@/shares/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/shares/components/ui/dropdown-menu";

/**
 * Chuyển ngôn ngữ, giữ nguyên trang tương ứng (pathname đã dịch), tham số động và query.
 * Phiên đăng nhập nằm trong cookie nên không bị mất.
 *
 * @returns Nút chọn ngôn ngữ.
 */
export function LanguageSwitcher({ className }: { className?: string } = {}) {
  const t = useTranslations("common.language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const changeLocale = (next: string) => {
    const firstSegment = window.location.pathname.split("/")[1];
    if (!LOCALES.some((item) => item === firstSegment)) {
      document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(next)}; Path=/; SameSite=Lax`;
      window.location.reload();
      return;
    }

    const query = Object.fromEntries(searchParams.entries());
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- pathname và params luôn khớp với route hiện tại.
        { pathname, params, query },
        { locale: next as AppLocale },
      );
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={className}
          aria-label={t("label")}
          disabled={isPending}
          data-testid="language-switcher"
        >
          <Languages />
          <span className="uppercase">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={locale} onValueChange={changeLocale}>
          {LOCALES.map((item) => (
            <DropdownMenuRadioItem key={item} value={item} data-testid={`locale-${item}`}>
              {t(item)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
