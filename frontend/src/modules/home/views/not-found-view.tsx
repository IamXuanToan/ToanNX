"use client";

import { ArrowLeft, FileQuestion, Home, Images, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { LogoMark } from "@/shares/components/layout/logo";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";

import { ATTACHMENT_ROUTES } from "@/modules/attachment/constants/routes";
import { AUTH_ROUTES } from "@/modules/auth/constants/routes";
import { HOME_ROUTES } from "../constants/routes";

/**
 * Trang 404 theo ngôn ngữ (Không tìm thấy trang).
 *
 * @returns Giao diện 404 chuẩn với badge, icon, thông điệp rõ ràng và các lối điều hướng nhanh.
 */
export function NotFoundView() {
  const t = useTranslations("errors.notFound");
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(HOME_ROUTES.home);
    }
  };

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <Link
          href={HOME_ROUTES.home}
          className="mb-6 inline-flex items-center gap-2"
          aria-label={t("home")}
        >
          <LogoMark className="size-10" />
        </Link>

        <Badge variant="outline" className="mb-2 rounded-full px-3 py-1 font-mono text-xs">
          {t("badge")}
        </Badge>

        <p className="text-muted-foreground/20 text-8xl font-black tracking-tighter select-none sm:text-9xl">
          404
        </p>

        <div className="bg-muted/70 border-border/60 -mt-10 mb-4 flex size-16 items-center justify-center rounded-3xl border shadow-xs backdrop-blur-xs">
          <FileQuestion className="text-muted-foreground size-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{t("description")}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="h-10 rounded-xl px-5 font-medium shadow-xs">
            <Link href={HOME_ROUTES.home}>
              <Home className="size-4" />
              {t("backHome")}
            </Link>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="h-10 rounded-xl px-4 font-medium"
          >
            <ArrowLeft className="size-4" />
            {t("backPrevious")}
          </Button>
        </div>

        {/* Các liên kết nhanh */}
        <div className="border-border/50 text-muted-foreground mt-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 border-t pt-6 text-xs">
          <span className="text-foreground font-medium">{t("helpfulLinks")}:</span>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs"
          >
            <Link href={HOME_ROUTES.home}>
              <Home className="size-3.5" />
              {t("home")}
            </Link>
          </Button>
          <span className="text-border">•</span>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs"
          >
            <Link href={ATTACHMENT_ROUTES.library}>
              <Images className="size-3.5" />
              {t("library")}
            </Link>
          </Button>
          <span className="text-border">•</span>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs"
          >
            <Link href={AUTH_ROUTES.login}>
              <LogIn className="size-3.5" />
              {t("signIn")}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
