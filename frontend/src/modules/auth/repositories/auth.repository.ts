import { API_ENDPOINTS } from "@/shares/constants/api-endpoints";
import { apiClient } from "@/shares/lib/api/api-client";

import type { CurrentUser, LoginCredentials } from "../types/auth.types";

/** Gọi API xác thực. Không chứa React hook hay UI state. */
export const authRepository = {
  /**
   * Đăng nhập; backend đặt cookie phiên.
   *
   * @param credentials - Email và mật khẩu.
   * @returns Người dùng hiện tại.
   */
  async login(credentials: LoginCredentials): Promise<CurrentUser> {
    return (await apiClient.post<CurrentUser>(API_ENDPOINTS.auth.login, credentials)).data;
  },

  /**
   * Lấy người dùng hiện tại.
   *
   * @param signal - Tín hiệu hủy.
   * @returns Người dùng hiện tại.
   */
  async me(signal?: AbortSignal): Promise<CurrentUser> {
    return (await apiClient.get<CurrentUser>(API_ENDPOINTS.auth.me, { signal })).data;
  },

  /** Đăng xuất phiên hiện tại. */
  async logout(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.auth.logout);
  },

  /** Đăng xuất mọi thiết bị. */
  async logoutAll(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.auth.logoutAll);
  },
};
