"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

import { Link, useRouter } from "@/i18n/navigation";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { Button } from "@/shares/components/ui/button";

import { AuthShell } from "../components/auth-shell";
import { authService, sanitizeNextPath } from "../services/auth.service";

type CallbackStatus = "processing" | "success" | "error";

/**
 * Màn hình xử lý callback OAuth sau khi người dùng xác thực tại Google / GitHub:
 * Tích hợp khung chuẩn AuthShell, hiệu ứng cực quang, loading spinner chuyển sắc
 * và thông báo lỗi/hướng dẫn liên kết tài khoản rõ ràng, an toàn.
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
  const executedRef = useRef(false);

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

      if (!storedState || storedState !== state) {
        setStatus("error");
        setErrorText("State mismatch (CSRF protection failed). Vui lòng thử lại.");
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

        setStatus("success");

        // Chuyển hướng sau khi thành công (tránh router.replace của next-intl làm lặp prefix locale nếu next đã có /vi)
        setTimeout(() => {
          if (next) {
            const separator = next.includes("?") ? "&" : "?";
            const target = mode === "link" ? `${next}${separator}profile=open&tab=social` : next;
            window.location.assign(target);
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
        }, 800);
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

  const shellTitle =
    status === "processing"
      ? t("callbackTitle")
      : status === "success"
        ? t("callbackSuccess")
        : isNotLinked
          ? "Tài khoản chưa được liên kết"
          : t("callbackFailed");

  return (
    <AuthShell homeHref="/login" title={shellTitle}>
      {status === "processing" ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
          <div className="relative flex size-16 items-center justify-center">
            <div className="from-primary/20 via-ring/20 to-primary/5 absolute inset-0 animate-pulse rounded-full bg-gradient-to-tr blur-md" />
            <Loader2 className="text-primary size-10 animate-spin" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="text-foreground text-sm font-semibold">{t("callbackProcessing")}</p>
            <p className="text-muted-foreground text-xs">
              Vui lòng giữ nguyên trình duyệt trong giây lát...
            </p>
          </div>
        </div>
      ) : null}

      {status === "success" ? (
        <div className="animate-in fade-in-50 flex flex-col items-center justify-center space-y-4 py-6 text-center duration-200">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-10" aria-hidden />
          </div>
          <p className="text-foreground text-sm font-semibold">{t("callbackSuccess")}</p>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="animate-in fade-in-50 space-y-5 py-2 duration-200">
          <div
            role="alert"
            className={`flex items-start gap-3 rounded-2xl border p-4 text-xs leading-relaxed ${
              isNotLinked
                ? "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100"
                : "border-destructive/30 bg-destructive/10 text-destructive"
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
            <div className="flex-1 space-y-1.5">
              <p className="text-sm font-bold">
                {isNotLinked ? "Chưa liên kết tài khoản" : "Không thể hoàn tất xác thực"}
              </p>
              <p className="text-xs leading-relaxed opacity-90">
                {isNotLinked
                  ? "Tài khoản mạng xã hội này chưa được liên kết với bất kỳ người dùng nào trong hệ thống. Để bảo mật, vui lòng đăng nhập bằng mật khẩu trước, sau đó vào Hồ sơ cá nhân > Tài khoản liên kết để kích hoạt."
                  : errorText}
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="default"
            className="h-11 w-full rounded-xl font-medium shadow-xs"
          >
            <Link href="/login">{t("callbackBackToLogin")}</Link>
          </Button>
        </div>
      ) : null}
    </AuthShell>
  );
}
