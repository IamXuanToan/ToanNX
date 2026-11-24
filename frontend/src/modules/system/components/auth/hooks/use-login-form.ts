"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

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
      sessionStorage.setItem("oauth_state", state);
      sessionStorage.setItem("oauth_mode", "login");
      const next = searchParams.get("redirect") || searchParams.get("next");
      if (next) {
        sessionStorage.setItem("oauth_next", next);
      } else {
        sessionStorage.removeItem("oauth_next");
      }
      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
      const res = await authService.getSocialAuthUrl(provider, state, redirectUri);
      window.location.href = res.authorizationUrl;
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
      const isAdminTarget = next.includes("/admin") || next.includes("/quan-tri");
      if (!isStaffUser && isAdminTarget) {
        router.replace("/portal" as never);
      } else {
        window.location.assign(next);
      }
    } else {
      // Người dùng có is_staff=True thì vào trang admin, không thì vào client portal
      const destination = isStaffUser ? redirectTo : ("/portal" as AppPathname);
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
