import { Suspense } from "react";
import { SocialAuthCallbackView } from "@/modules/system/views/auth/social-auth-callback-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "system.auth.login.callbackTitle",
  index: false,
});

type Props = {
  params: Promise<{
    provider: string;
  }>;
};

/**
 * Trang xử lý callback OAuth từ Google / GitHub.
 *
 * @param props - Tham số route chứa provider.
 * @returns Giao diện callback OAuth.
 */
export default async function SocialAuthCallbackPage({ params }: Props) {
  const { provider } = await params;
  return (
    <Suspense>
      <SocialAuthCallbackView provider={provider} />
    </Suspense>
  );
}
