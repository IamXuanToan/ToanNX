"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { PasswordInput } from "@/shares/components/common/password-input";
import { Button } from "@/shares/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";

import { useLoginForm } from "./hooks/use-login-form";

/**
 * Form đăng nhập email + mật khẩu.
 *
 * @returns Form đăng nhập.
 */
export function LoginForm() {
  const t = useTranslations("auth.login");
  const { form, onSubmit, isSubmitting, rootError } = useLoginForm();
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5" data-testid="login-form">
      {rootError ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{rootError}</span>
        </div>
      ) : null}
      <FieldGroup>
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            autoFocus
            placeholder="admin@toannx.com"
            aria-invalid={Boolean(errors.email)}
            {...form.register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...form.register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : null}
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
