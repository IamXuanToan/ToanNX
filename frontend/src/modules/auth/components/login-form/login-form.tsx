"use client";
import { Form } from "@/shares/components/common/form/form";
import { FormField } from "@/shares/components/common/form-field/form-field";

import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { PasswordInput } from "@/shares/components/common/password-input/password-input";
import { Button } from "@/shares/components/ui/button";
import { FieldGroup } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";

import { useLoginForm } from "./hooks/use-login-form";

/**
 * Form đăng nhập: email hoặc tên người dùng + mật khẩu.
 *
 * @returns Form đăng nhập.
 */
export function LoginForm() {
  const t = useTranslations("auth.login");
  const { form, onSubmit, isSubmitting, rootError } = useLoginForm();

  return (
    <Form onSubmit={onSubmit} noValidate className="space-y-5" data-testid="login-form">
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
        <FormField control={form.control} name="identifier" label={t("identifier")} required>
          {(field) => (
            <Input
              {...field}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
            />
          )}
        </FormField>
        <FormField control={form.control} name="password" label={t("password")} required>
          {(field) => <PasswordInput {...field} autoComplete="current-password" />}
        </FormField>
      </FieldGroup>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : null}
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </Form>
  );
}
