import { Suspense } from "react";

import { ForgotPasswordView } from "@/modules/auth/views/forgot-password-view";
import { HOME_ROUTES } from "@/modules/home/constants/routes";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "auth.forgotPassword.title",
  index: false,
  alternates: "/forgot-password",
});

/**
 * Trang quên mật khẩu.
 *
 * @returns ForgotPasswordView.
 */
export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordView homeHref={HOME_ROUTES.home} />
    </Suspense>
  );
}
