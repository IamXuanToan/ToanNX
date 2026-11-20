"use client";

import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Form } from "@/shares/components/common/form";
import { FormField } from "@/shares/components/common/form-field";
import { PasswordInput } from "@/shares/components/common/password-input";
import { Button } from "@/shares/components/ui/button";
import { FieldGroup } from "@/shares/components/ui/field";

import { useResetPasswordForm } from "./hooks/use-reset-password-form";

/**
 * Form nhập mật khẩu mới sau khi xác thực token.
 *
 * @returns Giao diện form hoặc thông báo kết quả.
 */
export function ResetPasswordForm() {
  const t = useTranslations("auth.resetPassword");
  const { form, onSubmit, isValidatingToken, isTokenValid, isSubmitting, isSuccess, rootError } =
    useResetPasswordForm();

  if (isValidatingToken) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
        <Loader2 className="text-primary size-8 animate-spin" />
        <p className="text-muted-foreground text-sm">{t("submitting")}</p>
      </div>
    );
  }

  if (isTokenValid === false) {
    return (
      <div className="space-y-6 text-center" data-testid="reset-password-invalid-token">
        <div className="bg-destructive/10 text-destructive mx-auto flex size-14 items-center justify-center rounded-full">
          <ShieldAlert className="size-7" />
        </div>
        <div className="space-y-2">
          <h3 className="text-foreground text-lg font-semibold">{t("invalidTokenTitle")}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("invalidTokenDescription")}
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button asChild size="lg" className="w-full">
            <Link href="/forgot-password">
              <KeyRound className="mr-2 size-4" />
              {t("requestNewLink")}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="w-full text-xs">
            <Link href="/login">
              <ArrowLeft className="mr-1.5 size-3.5" />
              {t("backToLogin")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center" data-testid="reset-password-success">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="size-7" />
        </div>
        <div className="space-y-2">
          <h3 className="text-foreground text-lg font-semibold">{t("successTitle")}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{t("successDescription")}</p>
        </div>

        <div className="pt-2">
          <Button asChild size="lg" className="w-full">
            <Link href="/login">{t("backToLogin")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form onSubmit={onSubmit} noValidate className="space-y-5" data-testid="reset-password-form">
      {rootError ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{rootError}</span>
        </div>
      ) : null}

      <p className="text-muted-foreground text-sm leading-relaxed">{t("description")}</p>

      <FieldGroup>
        <FormField control={form.control} name="password" label={t("password")} required>
          {(field) => (
            <PasswordInput
              {...field}
              autoComplete="new-password"
              placeholder={t("passwordPlaceholder")}
              autoFocus
            />
          )}
        </FormField>
        <FormField
          control={form.control}
          name="confirmPassword"
          label={t("confirmPassword")}
          required
        >
          {(field) => (
            <PasswordInput
              {...field}
              autoComplete="new-password"
              placeholder={t("confirmPasswordPlaceholder")}
            />
          )}
        </FormField>
      </FieldGroup>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>

      <div className="pt-2 text-center">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground inline-flex items-center text-xs font-medium transition-colors hover:underline"
        >
          <ArrowLeft className="mr-1 size-3.5" />
          {t("backToLogin")}
        </Link>
      </div>
    </Form>
  );
}
