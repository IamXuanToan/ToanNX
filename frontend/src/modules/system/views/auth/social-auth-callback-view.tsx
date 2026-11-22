"use client";

import { SocialAuthCallback } from "../../components/auth/social-auth-callback";

/**
 * Màn hình xử lý callback OAuth sau khi người dùng xác thực tại Google / GitHub.
 *
 * @param props - Tên provider (google, github).
 * @returns Giao diện trạng thái xử lý OAuth.
 */
export function SocialAuthCallbackView({ provider }: { provider: string }) {
  return <SocialAuthCallback provider={provider} />;
}
