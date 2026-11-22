"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, ChevronRight, Loader2, ShieldAlert } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";

import { AuthShell } from "./auth-shell";
import { useSocialAuthCallback } from "./hooks/use-social-auth-callback";

/**
 * Giao diện callback OAuth sau khi người dùng xác thực tại Google / GitHub: đang xử lý, thành công (tự chuyển
 * trang, có nút chuyển ngay), thất bại hoặc chưa liên kết tài khoản (hướng dẫn đăng nhập bằng mật khẩu).
 *
 * @param props - Tên provider (google, github).
 * @returns Giao diện trạng thái xử lý OAuth trong khung AuthShell.
 */
export function SocialAuthCallback({ provider }: { provider: string }) {
  const t = useTranslations("system.auth.login");
  const {
    status,
    errorText,
    isNotLinked,
    providerName,
    providerIcon,
    shellTitle,
    shellDescription,
    handleRedirectNow,
  } = useSocialAuthCallback(provider);

  return (
    <AuthShell homeHref="/login" title={shellTitle} description={shellDescription}>
      {/* 1. Trạng thái Đang xử lý xác thực */}
      {status === "processing" ? (
        <div className="flex flex-col items-center justify-center space-y-5 py-4 text-center">
          <div className="relative flex size-16 items-center justify-center">
            <div className="from-primary/20 via-primary/10 absolute inset-0 animate-ping rounded-full bg-gradient-to-tr to-transparent blur-sm" />
            <div className="border-border/60 bg-muted/40 relative flex size-14 items-center justify-center rounded-2xl border shadow-xs backdrop-blur-md">
              <Loader2 className="text-primary size-7 animate-spin" aria-hidden />
            </div>
          </div>

          <div className="flex flex-col items-center space-y-2">
            {providerIcon ? (
              <div className="border-border/60 bg-muted/50 text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
                <Image
                  src={providerIcon}
                  alt={providerName}
                  width={14}
                  height={14}
                  className="size-3.5"
                />
                <span>{providerName} OAuth</span>
              </div>
            ) : null}
            <p className="text-muted-foreground max-w-[280px] text-xs leading-relaxed">
              {t("callbackProcessingWait")}
            </p>
          </div>

          {/* Vạch tiến trình chuyển động nhẹ nhàng */}
          <div className="bg-primary/10 h-1 w-44 overflow-hidden rounded-full">
            <div className="bg-primary h-full w-1/2 animate-pulse rounded-full" />
          </div>
        </div>
      ) : null}

      {/* 2. Trạng thái Xác thực thành công & Chuyển hướng */}
      {status === "success" ? (
        <div className="animate-in fade-in-50 zoom-in-95 flex flex-col items-center justify-center space-y-5 py-4 text-center duration-300">
          <div className="relative flex size-16 items-center justify-center">
            <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/10 blur-sm" />
            <div className="relative flex size-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 shadow-xs backdrop-blur-md dark:border-emerald-500/20 dark:text-emerald-400">
              <CheckCircle2 className="size-8" aria-hidden />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-foreground text-sm font-semibold tracking-tight">
              {t("callbackRedirecting")}
            </p>
            {/* Thanh tiến trình chuyển hướng */}
            <div className="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-emerald-500/15">
              <div className="h-full w-full animate-pulse rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* Nút chuyển hướng dự phòng khi người dùng không muốn chờ */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRedirectNow}
            className="text-muted-foreground hover:text-foreground h-8 gap-1 rounded-lg px-3 text-xs font-medium transition-colors"
          >
            <span>{t("callbackRedirectNow")}</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      ) : null}

      {/* 3. Trạng thái Xác thực thất bại hoặc Chưa liên kết */}
      {status === "error" ? (
        <div className="animate-in fade-in-50 space-y-5 py-2 duration-200">
          <div
            role="alert"
            className={`flex items-start gap-3 rounded-2xl border p-4 text-xs leading-relaxed ${
              isNotLinked
                ? "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:border-amber-500/20 dark:text-amber-100"
                : "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/20"
            }`}
          >
            {isNotLinked ? (
              <AlertCircle
                className="size-5 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden
              />
            ) : (
              <ShieldAlert className="text-destructive size-5 shrink-0" aria-hidden />
            )}
            <div className="flex-1">
              <p className="text-xs leading-relaxed font-medium">
                {isNotLinked ? t("callbackNotLinkedGuidance") : errorText || t("callbackFailed")}
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Button
              asChild
              variant="default"
              className="h-11 w-full rounded-xl font-medium shadow-xs"
            >
              <Link href="/login">
                {isNotLinked ? t("callbackLoginWithPassword") : t("callbackBackToLogin")}
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="text-muted-foreground hover:text-foreground h-10 w-full rounded-xl text-xs font-medium"
            >
              <Link href="/">{t("callbackBackHome")}</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </AuthShell>
  );
}
