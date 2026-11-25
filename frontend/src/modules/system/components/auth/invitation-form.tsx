"use client";

import { AlertCircle, ArrowLeft, Loader2, Mail, ShieldAlert, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Form } from "@/shares/components/common/form";
import { FormField } from "@/shares/components/common/form-field";
import { PasswordInput } from "@/shares/components/common/password-input";
import { Button } from "@/shares/components/ui/button";
import { FieldGroup } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";

import { SYSTEM_ROUTES } from "../../constants/routes";
import { useInvitationForm } from "./hooks/use-invitation-form";

/**
 * Form kích hoạt tài khoản và thiết lập mật khẩu lần đầu từ lời mời của quản trị viên.
 *
 * @returns Giao diện form hoặc thông báo lỗi token.
 */
export function InvitationForm() {
  const t = useTranslations("system.auth.invitation");
  const { isValidatingToken, invitationData, tokenError, form, onSubmit, isSubmitting, rootError } =
    useInvitationForm();

  if (isValidatingToken) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
        <Loader2 className="text-primary size-8 animate-spin" />
        <p className="text-muted-foreground text-sm">{t("checkingToken")}</p>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="space-y-6 text-center" data-testid="invitation-invalid-token">
        <div className="bg-destructive/10 text-destructive mx-auto flex size-14 items-center justify-center rounded-full">
          <ShieldAlert className="size-7" />
        </div>
        <div className="space-y-2">
          <h3 className="text-foreground text-lg font-semibold">{t("invalidTitle")}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{tokenError}</p>
        </div>

        <div className="pt-2">
          <Button asChild size="lg" className="w-full rounded-xl">
            <Link href={SYSTEM_ROUTES.login}>
              <ArrowLeft className="mr-1.5 size-4" />
              {t("backToLogin")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form onSubmit={onSubmit} noValidate className="space-y-5" data-testid="invitation-form">
      {rootError ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-xl border p-3 text-sm"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{rootError}</span>
        </div>
      ) : null}

      {/* Hiển thị email được mời */}
      {invitationData?.email ? (
        <div className="border-border/60 bg-muted/20 flex items-center gap-3 rounded-xl border p-3.5">
          <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Mail className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-[11px] font-medium">{t("invitedEmail")}</p>
            <p className="text-foreground truncate text-sm font-semibold">{invitationData.email}</p>
          </div>
        </div>
      ) : null}

      <FieldGroup>
        <FormField control={form.control} name="fullName" label={t("fullName")} required>
          {(field) => (
            <Input
              {...field}
              placeholder={t("fullNamePlaceholder")}
              autoComplete="name"
              disabled={isSubmitting}
            />
          )}
        </FormField>

        <FormField
          control={form.control}
          name="username"
          label={t("username")}
          description={t("usernameHint")}
        >
          {(field) => (
            <Input
              {...field}
              placeholder={t("usernamePlaceholder")}
              autoComplete="username"
              maxLength={150}
              disabled={isSubmitting}
            />
          )}
        </FormField>

        <FormField
          control={form.control}
          name="password"
          label={t("password")}
          required
          description={t("passwordHint")}
        >
          {(field) => (
            <PasswordInput
              {...field}
              placeholder={t("passwordPlaceholder")}
              autoComplete="new-password"
              disabled={isSubmitting}
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
              placeholder={t("confirmPasswordPlaceholder")}
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          )}
        </FormField>
      </FieldGroup>

      <Button type="submit" size="lg" className="w-full rounded-xl" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <UserCheck className="mr-2 size-4" />
        )}
        {isSubmitting ? t("activating") : t("submitButton")}
      </Button>
    </Form>
  );
}
