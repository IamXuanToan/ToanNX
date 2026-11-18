import { apiClient } from "@/shares/lib/api/api-client";

import { AUTH_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  CurrentUser,
  LoginCredentials,
  PasswordResetConfirmPayload,
  PasswordResetRequestPayload,
  PasswordResetResponse,
  PasswordResetTokenValidResponse,
  PasswordResetValidatePayload,
} from "../types/auth.types";

/**
 * Kiểm tra `next` an toàn để chuyển hướng sau đăng nhập (chống open redirect).
 *
 * @param next - Giá trị query `next`.
 * @returns Đường dẫn nội bộ hoặc null.
 */
export function sanitizeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  return next;
}

/** Service xác thực (BE `authentication/services/auth_service.py`): đăng nhập, đăng xuất. */
export const authService = {
  /**
   * Đăng nhập với email đã chuẩn hóa; backend đặt cookie phiên.
   *
   * @param credentials - Email và mật khẩu.
   * @returns Người dùng hiện tại.
   */
  async login(credentials: LoginCredentials): Promise<CurrentUser> {
    const body = { identifier: credentials.identifier.trim(), password: credentials.password };
    return (await apiClient.post<CurrentUser>(AUTH_API_ENDPOINTS.login, body)).data;
  },

  /** Đăng xuất phiên hiện tại. */
  async logout(): Promise<void> {
    await apiClient.post(AUTH_API_ENDPOINTS.logout);
  },

  /** Đăng xuất mọi thiết bị. */
  async logoutAll(): Promise<void> {
    await apiClient.post(AUTH_API_ENDPOINTS.logoutAll);
  },

  /**
   * Yêu cầu gửi email đặt lại mật khẩu (chống user enumeration).
   *
   * @param payload - Email và ngôn ngữ mong muốn.
   * @returns Thông báo hướng dẫn.
   */
  async requestPasswordReset(payload: PasswordResetRequestPayload): Promise<PasswordResetResponse> {
    return (
      await apiClient.post<PasswordResetResponse>(AUTH_API_ENDPOINTS.passwordResetRequest, payload)
    ).data;
  },

  /**
   * Kiểm tra tính hợp lệ của token đặt lại mật khẩu.
   *
   * @param payload - Uid và token.
   * @returns Trạng thái hợp lệ.
   */
  async validatePasswordResetToken(
    payload: PasswordResetValidatePayload,
  ): Promise<PasswordResetTokenValidResponse> {
    return (
      await apiClient.post<PasswordResetTokenValidResponse>(
        AUTH_API_ENDPOINTS.passwordResetValidate,
        payload,
      )
    ).data;
  },

  /**
   * Xác nhận đặt lại mật khẩu mới.
   *
   * @param payload - Uid, token và mật khẩu mới.
   * @returns Thông báo thành công.
   */
  async confirmPasswordReset(payload: PasswordResetConfirmPayload): Promise<PasswordResetResponse> {
    return (
      await apiClient.post<PasswordResetResponse>(AUTH_API_ENDPOINTS.passwordResetConfirm, payload)
    ).data;
  },
};
