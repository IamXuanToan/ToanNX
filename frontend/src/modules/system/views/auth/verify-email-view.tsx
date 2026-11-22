"use client";

import type { AppPathname } from "@/i18n/routing";

import { VerifyEmailStatus } from "../../components/auth/verify-email-status";

/**
 * Màn hình xác minh địa chỉ email người dùng (đang xác minh / thành công / thất bại).
 *
 * @param props - Đường dẫn trang chủ.
 * @returns Giao diện xác minh email.
 */
export function VerifyEmailView({ homeHref }: { homeHref: AppPathname }) {
  return <VerifyEmailStatus homeHref={homeHref} />;
}
