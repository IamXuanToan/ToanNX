"use client";
import Image from "next/image";
import { AlertCircle, Loader2 } from "lucide-react";
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
 * Form đăng nhập: email hoặc tên người dùng + mật khẩu, kèm đăng nhập nhanh Google & GitHub.
 *
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
      {/* Đăng nhập bằng Google & GitHub */}
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-2 text-xs font-semibold"
          onClick={() => void handleSocialLogin("google")}
          disabled={isSubmitting || Boolean(socialLoading) || !isGoogleEnabled}
          title={!isGoogleEnabled ? t("socialDisabledHint") : undefined}
          data-testid="login-google-button"
        >
          {socialLoading === "google" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Image src={ICON_PATHS.google} alt="Google" width={16} height={16} />
          )}
          <span className="truncate">
            Google {!isGoogleEnabled ? `(${t("temporarilyDisabled")})` : ""}
          </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-2 text-xs font-semibold"
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
              width={16}
              height={16}
              className="dark:invert"
            />
          )}
          <span className="truncate">
            GitHub {!isGithubEnabled ? `(${t("temporarilyDisabled")})` : ""}
          </span>
        </Button>
      </div>

      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="border-border/60 w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2 text-[11px] font-medium">
            {t("orContinueWith")}
          </span>
        </div>
      </div>

      <Form onSubmit={onSubmit} noValidate className="space-y-4" data-testid="login-form">
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
        <div className="flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors hover:underline"
          >
            {t("forgotPasswordLink")}
          </Link>
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || Boolean(socialLoading)}
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </Form>
    </div>
  );
}
