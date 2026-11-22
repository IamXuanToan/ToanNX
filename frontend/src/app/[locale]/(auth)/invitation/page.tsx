import { Suspense } from "react";

import { HOME_ROUTES } from "@/modules/home/constants/routes";
import { InvitationView } from "@/modules/system/views/auth/invitation-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "system.auth.invitation.pageTitle",
  index: false,
  alternates: "/invitation",
});

/**
 * Trang chấp nhận lời mời và kích hoạt tài khoản lần đầu.
 *
 * @returns InvitationView.
 */
export default function InvitationPage() {
  return (
    <Suspense>
      <InvitationView homeHref={HOME_ROUTES.home} />
    </Suspense>
  );
}
