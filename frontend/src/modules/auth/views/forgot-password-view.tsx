import { useTranslations } from "next-intl";

import type { AppPathname } from "@/i18n/routing";

import { AuthShell } from "../components/auth-shell";
import { ForgotPasswordForm } from "../components/forgot-password-form";

/**
 * Màn hình quên mật khẩu.
 *
 * @param props - Trang chủ để quay về khi bấm logo hoặc nút về trang chủ.
 * @returns Giao diện yêu cầu đặt lại mật khẩu.
 */
export function ForgotPasswordView({ homeHref }: { homeHref: AppPathname }) {
  const t = useTranslations("auth.forgotPassword");

  return (
    <AuthShell homeHref={homeHref} title={t("title")}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
