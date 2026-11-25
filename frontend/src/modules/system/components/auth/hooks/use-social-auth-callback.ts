"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter as useNextRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { ICON_PATHS } from "@/shares/lib/asset-paths";

import {
  AUTH_WORKSPACE_PATHS,
  OAUTH_MODE,
  OAUTH_STORAGE_KEYS,
  PROFILE_DIALOG_QUERY,
} from "../../../constants/auth-storage";
import { useSocialAuthExchange } from "../../../hooks/use-social-auth-exchange";
import type { CurrentUser } from "../../../types/auth.types";

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
  const nextRouter = useNextRouter();
  const searchParams = useSearchParams();
  const errorMessage = useApiErrorMessage();
  const { exchange, sanitizeNext } = useSocialAuthExchange();

  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isNotLinked, setIsNotLinked] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<string>("login");
  const [isStaffTarget, setIsStaffTarget] = useState(false);
  const executedRef = useRef(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      const storedState = sessionStorage.getItem(OAUTH_STORAGE_KEYS.state);
      const mode = sessionStorage.getItem(OAUTH_STORAGE_KEYS.mode) || OAUTH_MODE.login;
      const next = sanitizeNext(sessionStorage.getItem(OAUTH_STORAGE_KEYS.next));
      setAuthMode(mode);

      if (!storedState || storedState !== state) {
        setStatus("error");
        setErrorText(t("callbackCsrfFailed"));
        return;
      }

      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;

      try {
        const exchangeResult = await exchange(mode, provider, code, redirectUri);
        const currentUser =
          mode !== OAUTH_MODE.link ? (exchangeResult as CurrentUser | undefined) : undefined;
        const isStaffUser = Boolean(currentUser?.user?.isStaff || currentUser?.user?.isSuperuser);

        sessionStorage.removeItem(OAUTH_STORAGE_KEYS.state);
        sessionStorage.removeItem(OAUTH_STORAGE_KEYS.mode);
        sessionStorage.removeItem(OAUTH_STORAGE_KEYS.next);

        // Xác định đường dẫn chuyển tiếp đích
        let targetUrl: string | null = null;
        if (next) {
          const separator = next.includes("?") ? "&" : "?";
          targetUrl =
            mode === OAUTH_MODE.link
              ? `${next}${separator}${PROFILE_DIALOG_QUERY.openParam}=${PROFILE_DIALOG_QUERY.openValue}&${PROFILE_DIALOG_QUERY.tabParam}=${PROFILE_DIALOG_QUERY.socialTab}`
              : next;
          // Người dùng thường không được chuyển vào trang quản trị: đưa vào client portal
          const isAdminTarget =
            targetUrl.includes(AUTH_WORKSPACE_PATHS.admin) ||
            targetUrl.includes(AUTH_WORKSPACE_PATHS.adminViPrefix);
          if (!isStaffUser && isAdminTarget && mode !== OAUTH_MODE.link) {
            targetUrl = null;
          }
        }
        setIsStaffTarget(isStaffUser);
        setRedirectTarget(targetUrl);
        setStatus("success");

        // Tự động chuyển hướng sau 1000ms để người dùng cảm nhận được visual feedback thành công
        redirectTimerRef.current = setTimeout(() => {
          if (targetUrl) {
            nextRouter.replace(targetUrl);
          } else {
            if (mode === OAUTH_MODE.link) {
              router.replace({
                pathname: AUTH_WORKSPACE_PATHS.admin,
                query: {
                  [PROFILE_DIALOG_QUERY.openParam]: PROFILE_DIALOG_QUERY.openValue,
                  [PROFILE_DIALOG_QUERY.tabParam]: PROFILE_DIALOG_QUERY.socialTab,
                },
              });
            } else {
              router.replace(
                isStaffUser ? AUTH_WORKSPACE_PATHS.admin : (AUTH_WORKSPACE_PATHS.portal as never),
              );
            }
          }
        }, 1000);
      } catch (err: unknown) {
        sessionStorage.removeItem(OAUTH_STORAGE_KEYS.state);
        sessionStorage.removeItem(OAUTH_STORAGE_KEYS.mode);
        sessionStorage.removeItem(OAUTH_STORAGE_KEYS.next);

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
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [provider, searchParams, t, errorMessage, router, nextRouter, exchange, sanitizeNext]);

  const handleRedirectNow = () => {
    if (redirectTarget) {
      nextRouter.replace(redirectTarget);
    } else {
      if (authMode === OAUTH_MODE.link) {
        router.replace({
          pathname: AUTH_WORKSPACE_PATHS.admin,
          query: {
            [PROFILE_DIALOG_QUERY.openParam]: PROFILE_DIALOG_QUERY.openValue,
            [PROFILE_DIALOG_QUERY.tabParam]: PROFILE_DIALOG_QUERY.socialTab,
          },
        });
      } else {
        router.replace(
          isStaffTarget ? AUTH_WORKSPACE_PATHS.admin : (AUTH_WORKSPACE_PATHS.portal as never),
        );
      }
    }
  };

  // Xác định tiêu đề và mô tả của Card header
  const isLinkMode = authMode === OAUTH_MODE.link;
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
