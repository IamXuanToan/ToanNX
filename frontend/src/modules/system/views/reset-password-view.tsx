import { useTranslations } from "next-intl";

import type { AppPathname } from "@/i18n/routing";

import { AuthShell } from "../components/auth-shell";
import { ResetPasswordForm } from "../components/reset-password-form";

/**
 * Màn hình đặt lại mật khẩu mới.
 *
 * @param props - Trang chủ để quay về khi bấm logo hoặc nút về trang chủ.
 * @returns Giao diện đặt lại mật khẩu.
 */
export function ResetPasswordView({ homeHref }: { homeHref: AppPathname }) {
  const t = useTranslations("system.auth.resetPassword");

  return (
    <AuthShell homeHref={homeHref} title={t("title")}>
      <ResetPasswordForm />
    </AuthShell>
  );
}
