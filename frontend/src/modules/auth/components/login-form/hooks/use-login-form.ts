"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { useLogin } from "../../../hooks/use-login";
import { createLoginSchema, type LoginFormValues } from "../../../schemas/login.schema";
import { sanitizeNextPath } from "../../../services/auth.service";

/**
 * State và xử lý submit của form đăng nhập.
 *
 * @param redirectTo - Trang mở sau khi đăng nhập khi URL không có `next` (page truyền vào, auth không biết module khác).
 * @returns Form RHF, hàm submit, trạng thái gửi và lỗi chung.
 */
export function useLoginForm(redirectTo: AppPathname) {
  const t = useTranslations("auth.validation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const errorMessage = useApiErrorMessage();
  const schema = useMemo(() => createLoginSchema(t), [t]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
    } catch (error) {
      form.setError("root", { message: errorMessage(error) });
      return;
    }
    const next = sanitizeNextPath(searchParams.get("next"));
    if (next) {
      // `next` là URL đã có locale do proxy tạo ra.
      window.location.assign(next);
    } else {
      router.replace(redirectTo as never);
    }
  });

  return {
    form,
    onSubmit,
    isSubmitting: login.isPending,
    rootError: form.formState.errors.root?.message,
  };
}
