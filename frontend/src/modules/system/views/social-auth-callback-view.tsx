"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, ChevronRight, Loader2, ShieldAlert } from "lucide-react";

import { Link, useRouter } from "@/i18n/navigation";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { Button } from "@/shares/components/ui/button";
import { ICON_PATHS } from "@/shares/lib/asset-paths";

import { AuthShell } from "../components/auth-shell";
import { authService, sanitizeNextPath } from "../services/auth.service";

type CallbackStatus = "processing" | "success" | "error";

function getProviderDisplayName(provider: string): string {
  if (provider.toLowerCase() === "github") return "GitHub";
  if (provider.toLowerCase() === "google") return "Google";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function getProviderIconPath(provider: string): string | null {
  const p = provider.toLowerCase();
  if (p === "github") return ICON_PATHS.github;
  if (p === "google") return ICON_PATHS.google;
  return null;
}

/**
 * Màn hình xử lý callback OAuth sau khi người dùng xác thực tại Google / GitHub:
 * Tích hợp khung chuẩn AuthShell, phân cấp tiêu đề - mô tả trực quan, animation chuyển tiếp mượt mà,
 * không lặp lại nội dung, hỗ trợ nút chuyển hướng dự phòng và hướng dẫn liên kết tài khoản an toàn.
 *
 * @param props - Tên provider (google, github).
 * @returns Giao diện trạng thái xử lý OAuth chuẩn AuthShell.
 */
export function SocialAuthCallbackView({ provider }: { provider: string }) {
  const t = useTranslations("system.auth.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMessage = useApiErrorMessage();

  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isNotLinked, setIsNotLinked] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<string>("login");
  const executedRef = useRef(false);

  const providerName = getProviderDisplayName(provider);
  const providerIcon = getProviderIconPath(provider);

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

    async function processCallback() {
      const errorParam = searchParams.get("error");
      const errorDesc = searchParams.get("error_description");
      if (errorParam) {
        setStatus("error");
        setErrorText(errorDesc || errorParam);
        return;
      }

      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code || !state) {
        setStatus("error");
        setErrorText(t("callbackFailed"));
        return;
      }

      const storedState = sessionStorage.getItem("oauth_state");
      const mode = sessionStorage.getItem("oauth_mode") || "login";
      const next = sanitizeNextPath(sessionStorage.getItem("oauth_next"));
      setAuthMode(mode);

      if (!storedState || storedState !== state) {
        setStatus("error");
        setErrorText(t("callbackCsrfFailed"));
        return;
      }

      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;

      try {
        if (mode === "link") {
          await authService.linkSocialAccount(provider, code, redirectUri);
        } else {
          await authService.socialLogin(provider, code, redirectUri);
        }

        sessionStorage.removeItem("oauth_state");
        sessionStorage.removeItem("oauth_mode");
        sessionStorage.removeItem("oauth_next");

        // Xác định đường dẫn chuyển tiếp đích
        let targetUrl: string | null = null;
        if (next) {
          const separator = next.includes("?") ? "&" : "?";
          targetUrl = mode === "link" ? `${next}${separator}profile=open&tab=social` : next;
        }
        setRedirectTarget(targetUrl);
        setStatus("success");

        // Tự động chuyển hướng sau 1000ms để người dùng cảm nhận được visual feedback thành công
        const timer = setTimeout(() => {
          if (targetUrl) {
            window.location.assign(targetUrl);
          } else {
            if (mode === "link") {
              router.replace({
                pathname: "/admin",
                query: { profile: "open", tab: "social" },
              });
            } else {
              router.replace("/admin");
            }
          }
        }, 1000);

        return () => clearTimeout(timer);
      } catch (err: unknown) {
        sessionStorage.removeItem("oauth_state");
        sessionStorage.removeItem("oauth_mode");
        sessionStorage.removeItem("oauth_next");

        setStatus("error");
        const msg = errorMessage(err);
        const errObj = err as { code?: string };
        if (errObj?.code === "ACCOUNT_SOCIAL_NOT_LINKED") {
          setIsNotLinked(true);
        }
        setErrorText(msg);
      }
    }

    void processCallback();
  }, [provider, searchParams, t, errorMessage, router]);

  const handleRedirectNow = () => {
    if (redirectTarget) {
      window.location.assign(redirectTarget);
    } else {
      if (authMode === "link") {
        router.replace({
          pathname: "/admin",
          query: { profile: "open", tab: "social" },
        });
      } else {
        router.replace("/admin");
      }
    }
  };

  // Xác định tiêu đề và mô tả của Card header
  const isLinkMode = authMode === "link";
  const shellTitle =
    status === "processing"
      ? t("callbackTitle")
      : status === "success"
        ? isLinkMode
          ? t("callbackLinkSuccessTitle")
          : t("callbackSuccessTitle")
        : isNotLinked
          ? t("callbackNotLinkedTitle")
          : t("callbackFailedTitle");

  const shellDescription =
    status === "processing"
      ? t("callbackProcessing", { provider: providerName })
      : status === "success"
        ? isLinkMode
          ? t("callbackLinkSuccessDesc", { provider: providerName })
          : t("callbackSuccessDesc")
        : isNotLinked
          ? t("callbackNotLinkedDesc", { provider: providerName })
          : t("callbackFailedDesc");

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
