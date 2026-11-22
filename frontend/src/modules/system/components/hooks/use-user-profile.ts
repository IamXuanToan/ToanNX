"use client";

import { useUser } from "../../hooks/use-user";

/**
 * Dữ liệu hồ sơ người dùng: truy vấn chi tiết (lỗi do `QueryErrorState` hiển thị).
 *
 * @param id - Id người dùng.
 * @returns Truy vấn người dùng.
 */
export function useUserProfile(id: string) {
  const user = useUser(id);
  return { user };
}
