import { Suspense } from "react";

import { LoginView } from "@/modules/system/views/auth/login-view";
import { HOME_ROUTES } from "@/modules/home/constants/routes";
import { MANAGE_APP_ROUTES } from "@/modules/manage-app/constants/routes";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "system.auth.login.title",
  index: false,
  alternates: "/login",
});

/**
 * Trang đăng nhập.
 *
 * @returns LoginView.
 */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginView homeHref={HOME_ROUTES.home} redirectTo={MANAGE_APP_ROUTES.admin} />
    </Suspense>
  );
}
