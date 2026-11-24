"use client";

import Image from "next/image";
import { AlertCircle, Loader2, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { Form } from "@/shares/components/common/form";
import { FormField } from "@/shares/components/common/form-field";
import { PasswordInput } from "@/shares/components/common/password-input";
import { ICON_PATHS } from "@/shares/lib/asset-paths";
import { Button } from "@/shares/components/ui/button";
import { FieldGroup } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";

import { usePublicSettings } from "../../hooks/use-public-settings";
import { useLoginForm } from "./hooks/use-login-form";

/**
 * Form đăng nhập chuẩn hoá theo quy chuẩn UI/UX và thiết kế tối giản hiện đại:
 * - Hỗ trợ đăng nhập nhanh bằng Google & GitHub với layout nút to bản, rõ ràng.
 * - Phân cách 'hoặc dùng email' tinh tế.
 * - Hàng mật khẩu tích hợp trực tiếp link 'Quên mật khẩu?' ở góc trên bên phải.
 * - Nút Đăng nhập to màu đen tương phản cao (High-contrast primary action).
 *
 * @param props - Đường dẫn điều hướng sau khi đăng nhập thành công.
 * @returns Form đăng nhập.
 */
export function LoginForm({ redirectTo }: { redirectTo: AppPathname }) {
  const t = useTranslations("system.auth.login");
  const { data: publicSettings } = usePublicSettings();
  const { form, onSubmit, isSubmitting, rootError, socialLoading, handleSocialLogin } =
    useLoginForm(redirectTo);

  const isGoogleEnabled = publicSettings?.authGoogleEnabled ?? true;
  const isGithubEnabled = publicSettings?.authGithubEnabled ?? true;

  return (
    <div className="space-y-3.5">
      {/* 1. Đăng nhập nhanh bằng Google & GitHub */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="border-border/80 hover:bg-muted/50 h-10 w-full gap-2.5 rounded-xl text-xs font-medium shadow-2xs transition-colors sm:h-10.5 sm:text-sm"
          onClick={() => void handleSocialLogin("google")}
          disabled={isSubmitting || Boolean(socialLoading) || !isGoogleEnabled}
          title={!isGoogleEnabled ? t("socialDisabledHint") : undefined}
          data-testid="login-google-button"
        >
          {socialLoading === "google" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Image src={ICON_PATHS.google} alt="Google" width={18} height={18} />
          )}
          <span className="truncate">
            {t("continueWithGoogle")} {!isGoogleEnabled ? `(${t("temporarilyDisabled")})` : ""}
          </span>
        </Button>

        {isGithubEnabled ? (
          <Button
            type="button"
            variant="outline"
            className="border-border/80 hover:bg-muted/50 h-10 w-full gap-2.5 rounded-xl text-xs font-medium shadow-2xs transition-colors sm:h-10.5 sm:text-sm"
            onClick={() => void handleSocialLogin("github")}
            disabled={isSubmitting || Boolean(socialLoading) || !isGithubEnabled}
            title={!isGithubEnabled ? t("socialDisabledHint") : undefined}
            data-testid="login-github-button"
          >
            {socialLoading === "github" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Image
                src={ICON_PATHS.github}
                alt="GitHub"
                width={18}
                height={18}
                className="dark:invert"
              />
            )}
            <span className="truncate">
              {t("continueWithGithub")} {!isGithubEnabled ? `(${t("temporarilyDisabled")})` : ""}
            </span>
          </Button>
        ) : (
          <div className="hidden" data-testid="login-github-button" />
        )}
      </div>

      {/* 2. Đường phân cách 'hoặc dùng email' */}
      <div className="relative my-3 sm:my-3.5">
        <div className="absolute inset-0 flex items-center">
          <div className="border-border/60 w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card text-muted-foreground px-3 text-[11px] font-medium lowercase">
            {t("orUseEmail")}
          </span>
        </div>
      </div>

      {/* 3. Form nhập liệu thông tin đăng nhập */}
      <Form onSubmit={onSubmit} noValidate className="space-y-3.5" data-testid="login-form">
        {rootError ? (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{rootError}</span>
          </div>
        ) : null}

        <FieldGroup className="space-y-3">
          {/* Email */}
          <FormField control={form.control} name="identifier" label={t("identifier")}>
            {(field) => (
              <div className="relative">
                <User
                  aria-hidden
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
                />
                <Input
                  {...field}
                  type="text"
                  placeholder={t("identifierPlaceholder")}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  className="h-10.5 rounded-xl pl-10 text-sm"
                />
              </div>
            )}
          </FormField>

          {/* Mật khẩu tích hợp link Quên mật khẩu ở hàng trên góc phải */}
          <div className="relative">
            <div className="absolute top-0 right-0 z-10">
              <Link
                href="/forgot-password"
                className="text-primary hover:text-primary-hover text-xs font-medium transition-colors hover:underline"
              >
                {t("forgotPasswordLink")}
              </Link>
            </div>
            <FormField control={form.control} name="password" label={t("password")}>
              {(field) => (
                <PasswordInput
                  {...field}
                  placeholder={t("passwordPlaceholder")}
                  autoComplete="current-password"
                  className="h-10.5 rounded-xl text-sm"
                />
              )}
            </FormField>
          </div>
        </FieldGroup>

        {/* Nút gửi form Đăng nhập màu xanh primary thương hiệu */}
        <Button
          type="submit"
          size="lg"
          className="bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary-hover mt-1 h-10.5 w-full rounded-xl text-sm font-semibold shadow-md transition-all active:scale-[0.99]"
          disabled={isSubmitting || Boolean(socialLoading)}
        >
          {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </Form>
    </div>
  );
}
