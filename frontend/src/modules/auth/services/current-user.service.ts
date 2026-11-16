import { apiClient } from "@/shares/lib/api/api-client";

import { AUTH_API_ENDPOINTS } from "../constants/api-endpoints";
import type { CurrentUser, UpdateProfilePayload } from "../types/auth.types";

/**
 * Người dùng có quyền (superuser luôn có).
 *
 * @param current - Người dùng hiện tại.
 * @param permission - Mã quyền.
 * @returns True nếu có quyền.
 */
export function hasPermission(current: CurrentUser | undefined, permission: string): boolean {
  if (!current || !current.user.isActive) return false;
  return current.user.isSuperuser || current.permissions.includes(permission);
}

/**
 * Người dùng được vào khu vực quản trị.
 *
 * @param current - Người dùng hiện tại.
 * @returns True nếu là staff hoặc superuser.
 */
export function canAccessAdmin(current: CurrentUser | undefined): boolean {
  return Boolean(current?.user.isActive && (current.user.isStaff || current.user.isSuperuser));
}

/** Service người dùng hiện tại (BE `authentication/services/current_user_service.py`). */
export const currentUserService = {
  /**
   * Lấy người dùng đang đăng nhập (kèm quyền và module đang bật).
   *
   * @param signal - Tín hiệu hủy.
   * @returns Người dùng hiện tại.
   */
  async get(signal?: AbortSignal): Promise<CurrentUser> {
    return (await apiClient.get<CurrentUser>(AUTH_API_ENDPOINTS.me, { signal })).data;
  },

  /**
   * Cập nhật thông tin hồ sơ của chính người dùng hiện tại (PATCH `/auth/me`).
   *
   * @param payload - Dữ liệu cập nhật: họ, tên, tên người dùng, mật khẩu...
   * @param signal - Tín hiệu hủy.
   * @returns Người dùng hiện tại sau cập nhật.
   */
  async update(payload: UpdateProfilePayload, signal?: AbortSignal): Promise<CurrentUser> {
    return (await apiClient.patch<CurrentUser>(AUTH_API_ENDPOINTS.me, payload, { signal })).data;
  },
};
