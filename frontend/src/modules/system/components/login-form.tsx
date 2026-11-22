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

import { usePublicSettings } from "../hooks/use-public-settings";
import { useLoginForm } from "./hooks/use-login-form";

/**
 * Form đăng nhập chuẩn hoá theo quy chuẩn UI/UX:
 * - Hỗ trợ đăng nhập nhanh bằng Google & GitHub.
 * - Trường Email/Tên người dùng có icon User và placeholder rõ ràng.
 * - Trường Mật khẩu có icon Lock, nút xem/ẩn mật khẩu và link Quên mật khẩu.
 * - Chiều cao ô và nút đạt chuẩn h-11 cho màn xác thực đứng một mình.
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
    <div className="space-y-4">
      {/* 1. Đăng nhập nhanh bằng Google & GitHub */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="border-border/80 hover:bg-muted/50 h-11 gap-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
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
            Google {!isGoogleEnabled ? `(${t("temporarilyDisabled")})` : ""}
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="border-border/80 hover:bg-muted/50 h-11 gap-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
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
            GitHub {!isGithubEnabled ? `(${t("temporarilyDisabled")})` : ""}
          </span>
        </Button>
      </div>

      {/* 2. Đường phân cách */}
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="border-border/60 w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card text-muted-foreground px-2.5 text-[11px] font-medium tracking-wider">
            {t("orContinueWith")}
          </span>
        </div>
      </div>

      {/* 3. Form nhập liệu thông tin đăng nhập */}
      <Form onSubmit={onSubmit} noValidate className="space-y-4" data-testid="login-form">
        {rootError ? (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{rootError}</span>
          </div>
        ) : null}

        <FieldGroup className="space-y-3.5">
          {/* Email hoặc tên người dùng */}
          <FormField control={form.control} name="identifier" label={t("identifier")} required>
            {(field) => (
              <div className="relative">
                <User
                  aria-hidden
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
                />
                <Input
                  {...field}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  placeholder={t("identifierPlaceholder")}
                  className="h-11 rounded-xl pl-10 text-sm"
                />
              </div>
            )}
          </FormField>

          {/* Mật khẩu */}
          <FormField control={form.control} name="password" label={t("password")} required>
            {(field) => (
              <PasswordInput
                {...field}
                autoComplete="current-password"
                placeholder={t("passwordPlaceholder")}
                className="h-11 rounded-xl text-sm"
              />
            )}
          </FormField>
        </FieldGroup>

        {/* Link Quên mật khẩu */}
        <div className="flex items-center justify-end pt-0.5">
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-primary text-xs font-medium transition-colors hover:underline"
          >
            {t("forgotPasswordLink")}
          </Link>
        </div>

        {/* Nút gửi form Đăng nhập */}
        <Button
          type="submit"
          size="lg"
          className="h-11 w-full rounded-xl text-sm font-semibold shadow-xs"
          disabled={isSubmitting || Boolean(socialLoading)}
        >
          {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </Form>
    </div>
  );
}
