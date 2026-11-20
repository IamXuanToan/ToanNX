"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import {
  createForgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "../../schemas/forgot-password.schema";
import { authService } from "../../services/auth.service";

/**
 * Quản lý trạng thái và submit cho form quên mật khẩu.
 *
 * @returns Form, hàm submit, trạng thái gửi, email đã gửi thành công và hàm đặt lại.
 */
export function useForgotPasswordForm() {
  const t = useTranslations("system.auth.validation");
  const locale = useLocale();
  const errorMessage = useApiErrorMessage();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const schema = useMemo(() => createForgotPasswordSchema(t), [t]);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setIsPending(true);
    form.clearErrors("root");
    try {
      await authService.requestPasswordReset({
        email: values.email,
        locale,
      });
      setSubmittedEmail(values.email);
    } catch (error) {
      form.setError("root", { message: errorMessage(error) });
    } finally {
      setIsPending(false);
    }
  });

  const handleReset = () => {
    setSubmittedEmail(null);
    form.reset({ email: "" });
  };

  return {
    form,
    onSubmit,
    isSubmitting: isPending,
    submittedEmail,
    handleReset,
    rootError: form.formState.errors.root?.message,
  };
}
