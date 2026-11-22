"use client";

import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Form } from "@/shares/components/common/form";
import { FormField } from "@/shares/components/common/form-field";
import { Button } from "@/shares/components/ui/button";
import { FieldGroup } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";

import { useForgotPasswordForm } from "./hooks/use-forgot-password-form";

/**
 * Form yêu cầu đặt lại mật khẩu với cơ chế chống user enumeration.
 *
 * @returns Giao diện form hoặc thông báo hướng dẫn khi gửi thành công.
 */
export function ForgotPasswordForm() {
  const t = useTranslations("system.auth.forgotPassword");
  const { form, onSubmit, isSubmitting, submittedEmail, handleReset, rootError } =
    useForgotPasswordForm();

  if (submittedEmail) {
    return (
      <div className="space-y-6 text-center" data-testid="forgot-password-success">
        <div className="bg-primary/10 text-primary mx-auto flex size-14 items-center justify-center rounded-full">
          <Mail className="size-7" />
        </div>
        <div className="space-y-2">
          <h3 className="text-foreground text-lg font-semibold">{t("successTitle")}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{t("successDescription")}</p>
          <div className="bg-muted text-foreground mx-auto mt-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-xs">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span>{submittedEmail}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button asChild size="lg" className="w-full">
            <Link href="/login">
              <ArrowLeft className="mr-2 size-4" />
              {t("backToLogin")}
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} className="w-full text-xs">
            {t("resend")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form onSubmit={onSubmit} noValidate className="space-y-5" data-testid="forgot-password-form">
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
        <FormField control={form.control} name="email" label={t("email")} required>
          {(field) => (
            <Input
              {...field}
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
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
