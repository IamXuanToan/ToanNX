import { Suspense } from "react";

import { HOME_ROUTES } from "@/modules/home/constants/routes";
import { PORTAL_ROUTES } from "@/modules/portal/constants/routes";
import { LoginView } from "@/modules/system/views/auth/login-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "system.auth.login.title",
  index: false,
  alternates: "/login",
});

/**
 * Trang đăng nhập (mọi tài khoản kể cả Admin đều vào Client Portal mặc định sau khi đăng nhập).
 *
 * @returns LoginView.
 */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginView homeHref={HOME_ROUTES.home} redirectTo={PORTAL_ROUTES.dashboard} />
    </Suspense>
  );
}
