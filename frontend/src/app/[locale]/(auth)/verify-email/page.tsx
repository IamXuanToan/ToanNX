import { Suspense } from "react";

import { HOME_ROUTES } from "@/modules/home/constants/routes";
import { VerifyEmailView } from "@/modules/system/views/auth/verify-email-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "system.auth.verifyEmail.pageTitle",
  index: false,
  alternates: "/verify-email",
});

/**
 * Trang xác minh địa chỉ email người dùng.
 *
 * @returns VerifyEmailView.
 */
export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailView homeHref={HOME_ROUTES.home} />
    </Suspense>
  );
}
