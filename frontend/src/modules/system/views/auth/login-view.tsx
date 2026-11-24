import { useTranslations } from "next-intl";

import type { AppPathname } from "@/i18n/routing";

import { AuthShell } from "../../components/auth/auth-shell";
import { LoginForm } from "../../components/auth/login-form";

/**
 * Trang đăng nhập (không có đăng ký).
 *
 * @param props - Trang chủ (logo, nút về trang chủ) và trang mở sau đăng nhập.
 * @returns Giao diện đăng nhập.
 */
export function LoginView({
  homeHref,
  redirectTo,
}: {
  homeHref: AppPathname;
  redirectTo: AppPathname;
}) {
  const t = useTranslations("system.auth.login");

  return (
    <AuthShell homeHref={homeHref} title={t("title")}>
      <LoginForm redirectTo={redirectTo} />
    </AuthShell>
  );
}
