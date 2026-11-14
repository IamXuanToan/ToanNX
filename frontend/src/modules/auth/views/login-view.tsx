import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/shares/components/layout/language-switcher";
import { LogoMark } from "@/shares/components/layout/logo";
import { ThemeSwitcher } from "@/shares/components/layout/theme-switcher";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shares/components/ui/card";
import { APP_ROUTES } from "@/shares/constants/routes";

import { LoginForm } from "../components/login-form/login-form";

/**
 * Trang đăng nhập (không có đăng ký).
 *
 * @returns Giao diện đăng nhập.
 */
export function LoginView() {
  const t = useTranslations("auth.login");
  return (
    <main className="bg-muted/40 flex min-h-svh flex-col">
      <div className="flex justify-end gap-1 p-4">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm space-y-6">
          <Link href={APP_ROUTES.home} className="mx-auto flex w-fit flex-col items-center gap-3">
            <LogoMark className="size-12" title="TOANNX" />
            <span className="text-sm font-semibold tracking-[0.25em]">TOANNX</span>
          </Link>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
          <p className="text-muted-foreground text-center text-xs">{t("noSignup")}</p>
        </div>
      </div>
    </main>
  );
}
