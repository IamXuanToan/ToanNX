import { apiClient } from "@/shares/lib/api/api-client";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  AcceptInvitationPayload,
  CurrentUser,
  InvitationValidateResponse,
  LoginCredentials,
  PasswordResetConfirmPayload,
  PasswordResetRequestPayload,
  PasswordResetResponse,
  PasswordResetTokenValidResponse,
  PasswordResetValidatePayload,
  SocialAuthUrlResponse,
  UserSocialAccountSummary,
  VerifyEmailPayload,
} from "../types/auth.types";

/**
 * Kiểm tra `next` an toàn để chuyển hướng sau đăng nhập (chống open redirect).
 * Tự động loại bỏ các đoạn locale bị lặp ở đầu đường dẫn (ví dụ: `/vi/vi/quan-tri` -> `/vi/quan-tri`).
 *
 * @param next - Giá trị query `next`.
 * @returns Đường dẫn nội bộ hợp lệ đã chuẩn hóa hoặc null.
 */
export function sanitizeNextPath(next: string | null | undefined): string | null {
  if (!next || typeof next !== "string") return null;
  if (next !== next.trim() || /[\u0000-\u001f\u007f\\]/.test(next)) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  try {
    const parsed = new URL(next, "https://app.invalid");
    if (parsed.origin !== "https://app.invalid") return null;
  } catch {
    return null;
  }
  let cleaned = next;
  while (/^\/(vi|en)\/(?:vi|en)(\/.*|$)/.test(cleaned)) {
    cleaned = cleaned.replace(/^\/(vi|en)\/(?:vi|en)(\/.*|$)/, "/$1$2");
  }
  return cleaned;
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
    return (await apiClient.post<CurrentUser>(SYSTEM_API_ENDPOINTS.login, body)).data;
  },

  /** Đăng xuất phiên hiện tại. */
  async logout(): Promise<void> {
    await apiClient.post(SYSTEM_API_ENDPOINTS.logout);
  },

  /** Đăng xuất mọi thiết bị. */
  async logoutAll(): Promise<void> {
    await apiClient.post(SYSTEM_API_ENDPOINTS.logoutAll);
  },

  /**
   * Yêu cầu gửi email đặt lại mật khẩu (chống user enumeration).
   *
   * @param payload - Email và ngôn ngữ mong muốn.
   * @returns Thông báo hướng dẫn.
   */
  async requestPasswordReset(payload: PasswordResetRequestPayload): Promise<PasswordResetResponse> {
    return (
      await apiClient.post<PasswordResetResponse>(
        SYSTEM_API_ENDPOINTS.passwordResetRequest,
        payload,
      )
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
        SYSTEM_API_ENDPOINTS.passwordResetValidate,
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
      await apiClient.post<PasswordResetResponse>(
        SYSTEM_API_ENDPOINTS.passwordResetConfirm,
        payload,
      )
    ).data;
  },

  /** Gửi email xác minh tài khoản cho người dùng đang đăng nhập. */
  async sendVerificationEmail(): Promise<PasswordResetResponse> {
    return (await apiClient.post<PasswordResetResponse>(SYSTEM_API_ENDPOINTS.sendVerificationEmail))
      .data;
  },

  /** Xác minh địa chỉ email qua token. */
  async verifyEmail(payload: VerifyEmailPayload): Promise<PasswordResetResponse> {
    return (await apiClient.post<PasswordResetResponse>(SYSTEM_API_ENDPOINTS.verifyEmail, payload))
      .data;
  },

  /** Kiểm tra token lời mời tham gia hệ thống. */
  async validateInvitationToken(
    token: string,
    signal?: AbortSignal,
  ): Promise<InvitationValidateResponse> {
    return (
      await apiClient.get<InvitationValidateResponse>(SYSTEM_API_ENDPOINTS.invitation, {
        query: { token },
        signal,
      })
    ).data;
  },

  /** Chấp nhận lời mời, hoàn tất thông tin và đăng nhập luôn vào hệ thống. */
  async acceptInvitation(payload: AcceptInvitationPayload): Promise<CurrentUser> {
    return (await apiClient.post<CurrentUser>(SYSTEM_API_ENDPOINTS.acceptInvitation, payload)).data;
  },

  /** Lấy URL xác thực OAuth từ backend để chuyển hướng người dùng. */
  async getSocialAuthUrl(
    provider: string,
    state: string,
    redirectUri: string,
  ): Promise<SocialAuthUrlResponse> {
    return (
      await apiClient.get<SocialAuthUrlResponse>(SYSTEM_API_ENDPOINTS.socialAuthUrl(provider), {
        query: { state, redirectUri },
      })
    ).data;
  },

  /** Đăng nhập bằng mã code OAuth nhận từ nhà cung cấp. */
  async socialLogin(provider: string, code: string, redirectUri: string): Promise<CurrentUser> {
    return (
      await apiClient.post<CurrentUser>(SYSTEM_API_ENDPOINTS.socialLogin(provider), {
        code,
        redirectUri,
      })
    ).data;
  },

  /** Danh sách trạng thái liên kết tài khoản mạng xã hội của người dùng hiện tại. */
  async listSocialAccounts(signal?: AbortSignal): Promise<UserSocialAccountSummary[]> {
    return (
      await apiClient.get<UserSocialAccountSummary[]>(SYSTEM_API_ENDPOINTS.socialAccounts, {
        signal,
      })
    ).data;
  },

  /** Liên kết tài khoản mạng xã hội vào người dùng hiện tại bằng mã code OAuth. */
  async linkSocialAccount(
    provider: string,
    code: string,
    redirectUri: string,
  ): Promise<UserSocialAccountSummary> {
    return (
      await apiClient.post<UserSocialAccountSummary>(SYSTEM_API_ENDPOINTS.socialLink(provider), {
        code,
        redirectUri,
      })
    ).data;
  },

  /** Hủy liên kết một nền tảng mạng xã hội. */
  async unlinkSocialAccount(provider: string): Promise<void> {
    await apiClient.delete(SYSTEM_API_ENDPOINTS.socialUnlink(provider));
  },
};
