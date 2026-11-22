"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { ICON_PATHS } from "@/shares/lib/asset-paths";

import { useSocialAuthExchange } from "../../../hooks/use-social-auth-exchange";

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
 * Logic trang callback OAuth: kiểm `state` (chống CSRF), đổi mã lấy phiên hoặc liên kết tài khoản (một lần),
 * tự chuyển trang sau 1 giây, dựng tiêu đề/mô tả theo trạng thái.
 *
 * @param provider - Tên provider (google, github).
 * @returns Trạng thái, thông điệp, thông tin provider và hàm chuyển trang ngay.
 */
export function useSocialAuthCallback(provider: string) {
  const t = useTranslations("system.auth.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMessage = useApiErrorMessage();
  const { exchange, sanitizeNext } = useSocialAuthExchange();

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
      const next = sanitizeNext(sessionStorage.getItem("oauth_next"));
      setAuthMode(mode);

      if (!storedState || storedState !== state) {
        setStatus("error");
        setErrorText(t("callbackCsrfFailed"));
        return;
      }

      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;

      try {
        await exchange(mode, provider, code, redirectUri);

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
  }, [provider, searchParams, t, errorMessage, router, exchange, sanitizeNext]);

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

  return {
    status,
    errorText,
    isNotLinked,
    providerName,
    providerIcon,
    shellTitle,
    shellDescription,
    handleRedirectNow,
  };
}
