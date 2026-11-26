"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { toSafeHttpUrl } from "@/shares/lib/safe-url";

import {
  AUTH_WORKSPACE_PATHS,
  OAUTH_MODE,
  OAUTH_STORAGE_KEYS,
} from "../../../constants/auth-storage";
import { useLogin } from "../../../hooks/use-login";
import { createLoginSchema, type LoginFormValues } from "../../../schemas/login.schema";
import { authService, sanitizeNextPath } from "../../../services/auth.service";

/**
 * State và xử lý submit của form đăng nhập.
 *
 * @param redirectTo - Trang mở sau khi đăng nhập khi URL không có `next` (page truyền vào, auth không biết module khác).
 * @returns Form RHF, hàm submit, trạng thái gửi và lỗi chung.
 */
export function useLoginForm(redirectTo: AppPathname) {
  const t = useTranslations("system.auth.validation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const errorMessage = useApiErrorMessage();
  const schema = useMemo(() => createLoginSchema(t), [t]);

  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "" },
    mode: "onTouched",
  });

  const handleSocialLogin = async (provider: string) => {
    if (socialLoading) return;
    setSocialLoading(provider);
    try {
      const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem(OAUTH_STORAGE_KEYS.state, state);
      sessionStorage.setItem(OAUTH_STORAGE_KEYS.mode, OAUTH_MODE.login);
      const next = searchParams.get("redirect") || searchParams.get("next");
      if (next) {
        sessionStorage.setItem(OAUTH_STORAGE_KEYS.next, next);
      } else {
        sessionStorage.removeItem(OAUTH_STORAGE_KEYS.next);
      }
      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
      const res = await authService.getSocialAuthUrl(provider, state, redirectUri);
      const safeAuthUrl = toSafeHttpUrl(res.authorizationUrl, { allowRelative: false });
      if (!safeAuthUrl) {
        setSocialLoading(null);
        return;
      }
      window.location.href = safeAuthUrl;
    } catch (error) {
      form.setError("root", { message: errorMessage(error) });
      setSocialLoading(null);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    let currentUser;
    try {
      currentUser = await login.mutateAsync(values);
    } catch (error) {
      form.setError("root", { message: errorMessage(error) });
      return;
    }
    const isStaffUser = Boolean(currentUser.user?.isStaff || currentUser.user?.isSuperuser);
    const next = sanitizeNextPath(searchParams.get("redirect") || searchParams.get("next"));
    if (next) {
      // Người dùng thường không được chuyển vào trang quản trị: đưa vào client portal
      const isAdminTarget =
        next.includes(AUTH_WORKSPACE_PATHS.admin) ||
        next.includes(AUTH_WORKSPACE_PATHS.adminViPrefix);
      if (!isStaffUser && isAdminTarget) {
        router.replace(AUTH_WORKSPACE_PATHS.portal as never);
      } else {
        window.location.assign(next);
      }
    } else {
      // Mọi tài khoản (kể cả Admin) mặc định luôn vào Client Portal; Admin tự chuyển sang /admin sau khi đăng nhập
      const destination = redirectTo || (AUTH_WORKSPACE_PATHS.portal as AppPathname);
      router.replace(destination as never);
    }
  });

  return {
    form,
    onSubmit,
    isSubmitting: login.isPending,
    rootError: form.formState.errors.root?.message,
    socialLoading,
    handleSocialLogin,
  };
}
