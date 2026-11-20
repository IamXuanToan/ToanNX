"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { createResetPasswordSchema, type ResetPasswordFormValues } from "../../schemas/reset-password.schema";
import { authService } from "../../services/auth.service";

/**
 * Quản lý xác thực token và cập nhật mật khẩu mới.
 *
 * @returns Form, hàm submit, trạng thái token và trạng thái thành công.
 */
export function useResetPasswordForm() {
  const t = useTranslations("auth.validation");
  const searchParams = useSearchParams();
  const errorMessage = useApiErrorMessage();

  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const schema = useMemo(() => createResetPasswordSchema(t), [t]);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  useEffect(() => {
    let active = true;

    async function checkToken() {
      if (!uid || !token) {
        if (active) {
          setIsTokenValid(false);
          setIsValidatingToken(false);
        }
        return;
      }

      try {
        await authService.validatePasswordResetToken({ uid, token });
        if (active) {
          setIsTokenValid(true);
        }
      } catch {
        if (active) {
          setIsTokenValid(false);
        }
      } finally {
        if (active) {
          setIsValidatingToken(false);
        }
      }
    }

    void checkToken();

    return () => {
      active = false;
    };
  }, [uid, token]);

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    form.clearErrors("root");
    try {
      await authService.confirmPasswordReset({
        uid,
        token,
        new_password: values.password,
      });
      setIsSuccess(true);
    } catch (error) {
      form.setError("root", { message: errorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    form,
    onSubmit,
    isValidatingToken,
    isTokenValid,
    isSubmitting,
    isSuccess,
    rootError: form.formState.errors.root?.message,
  };
}
