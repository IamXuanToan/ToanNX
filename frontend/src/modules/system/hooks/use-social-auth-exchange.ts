"use client";

import { useCallback } from "react";

import { authService, sanitizeNextPath } from "../services/auth.service";

/**
 * Đổi mã OAuth (Google/GitHub) lấy phiên đăng nhập hoặc liên kết tài khoản. Không dùng React Query vì đây là
 * một lần đổi mã duy nhất khi mở trang callback (không cache, không retry).
 *
 * @returns `exchange(mode, provider, code, redirectUri)` và `sanitizeNext` (chặn chuyển hướng ra ngoài site).
 */
export function useSocialAuthExchange() {
  const exchange = useCallback(
    async (mode: string, provider: string, code: string, redirectUri: string) => {
      if (mode === "link") {
        return await authService.linkSocialAccount(provider, code, redirectUri);
      } else {
        return await authService.socialLogin(provider, code, redirectUri);
      }
    },
    [],
  );
  return { exchange, sanitizeNext: sanitizeNextPath };
}
