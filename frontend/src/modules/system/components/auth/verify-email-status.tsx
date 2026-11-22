"use client";

import { AlertCircle, CheckCircle2, Home, Loader2, LogIn, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { Button } from "@/shares/components/ui/button";

import { AuthShell } from "./auth-shell";
import { useVerifyEmail } from "./hooks/use-verify-email";

/**
 * Trạng thái xác minh địa chỉ email:
 * - Trạng thái 1: Đang xác minh (Spinner).
 * - Trạng thái 2: Xác minh thành công (Checkmark xanh, nút Về trang chủ / Đăng nhập).
 * - Trạng thái 3: Thất bại hoặc hết hạn (Alert đỏ, nút Thử lại / Về trang chủ).
 *
 * @param props - Đường dẫn trang chủ.
 * @returns Giao diện xác minh email.
 */
export function VerifyEmailStatus({ homeHref }: { homeHref: AppPathname }) {
  const t = useTranslations("system.auth.verifyEmail");
  const { isLoading, isSuccess, errorText, handleRetry } = useVerifyEmail();

  return (
    <AuthShell homeHref={homeHref} title={t("pageTitle")}>
      <div className="space-y-6 text-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="text-primary size-10 animate-spin" />
            <p className="text-muted-foreground text-sm font-medium">{t("verifying")}</p>
          </div>
        ) : isSuccess ? (
          <div className="animate-in fade-in-50 space-y-5 duration-200">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-foreground text-lg font-bold">{t("successTitle")}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("successDescription")}
              </p>
            </div>
            <div className="pt-2">
              <Button asChild size="lg" className="w-full rounded-xl">
                <Link href={homeHref as never}>
                  <Home className="mr-2 size-4" />
                  {t("backToHome")}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in-50 space-y-5 duration-200">
            <div className="bg-destructive/10 text-destructive mx-auto flex size-14 items-center justify-center rounded-full">
              <AlertCircle className="size-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-foreground text-lg font-bold">{t("errorTitle")}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {errorText || t("errorDescription")}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full rounded-xl"
                onClick={handleRetry}
              >
                <RotateCcw className="mr-2 size-4" />
                {t("retry")}
              </Button>
              <Button asChild variant="ghost" size="sm" className="w-full text-xs">
                <Link href="/login">
                  <LogIn className="mr-1.5 size-3.5" />
                  {t("backToLogin")}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
