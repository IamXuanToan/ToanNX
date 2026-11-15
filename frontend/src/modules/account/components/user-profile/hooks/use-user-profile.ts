"use client";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { useUser } from "../../../hooks/use-account-queries";

/**
 * Dữ liệu hồ sơ người dùng: truy vấn chi tiết và thông báo lỗi đã dịch.
 *
 * @param id - Id người dùng.
 * @returns Truy vấn người dùng và hàm dịch lỗi API.
 */
export function useUserProfile(id: string) {
  const user = useUser(id);
  const errorMessage = useApiErrorMessage();
  return { user, errorMessage };
}
