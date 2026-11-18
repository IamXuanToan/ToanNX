import { Suspense } from "react";

import { ResetPasswordView } from "@/modules/auth/views/reset-password-view";
import { HOME_ROUTES } from "@/modules/home/constants/routes";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "auth.resetPassword.title",
  index: false,
  alternates: "/reset-password",
});

/**
 * Trang đặt lại mật khẩu mới.
 *
 * @returns ResetPasswordView.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordView homeHref={HOME_ROUTES.home} />
    </Suspense>
  );
}
