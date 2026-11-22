import type { AttachmentSummary } from "@/shares/types/attachment.types";

/**
 * Người dùng đang đăng nhập (`/system/auth/me`). Khai riêng với `User` của danh sách người dùng vì
 * response khác nhau; hình dạng khớp response của BE.
 */
export type AuthUser = {
  id: string;
  email: string;
  username: string | null;
  fullName: string;
  avatar: AttachmentSummary | null;
  isActive: boolean;
  isStaff: boolean;
  isSuperuser: boolean;
  isNovel: boolean;
  isVerified: boolean;
  emailVerifiedAt: string | null;
  socialAccounts?: UserSocialAccountSummary[];
  lastLogin: string | null;
  lastSeenAt: string | null;
  dateJoined: string;
};

/** Vai trò rút gọn của người dùng hiện tại. */
export type AuthRole = {
  id: string;
  code: string;
  name: string;
};

/** Dữ liệu `/system/auth/me`: người dùng, vai trò và quyền hiệu lực. */
export type CurrentUser = {
  user: AuthUser;
  roles: AuthRole[];
  permissions: string[];
};

/** Thông tin đăng nhập. */
export type LoginCredentials = {
  /** Email hoặc tên người dùng. */
  identifier: string;
  password: string;
};

/** Dữ liệu cập nhật hồ sơ cá nhân qua PATCH `/system/auth/me`. */
export type UpdateProfilePayload = {
  /** Email đăng nhập mới (tùy chọn). */
  email?: string;
  /** Họ và tên đầy đủ. */
  fullName?: string;
  /** Tên (tương thích cũ). */
  firstName?: string;
  /** Họ (tương thích cũ). */
  lastName?: string;
  /** Tên người dùng. */
  username?: string;
  /** Id attachment ảnh đại diện; null để gỡ ảnh. */
  avatarId?: string | null;
  /** Mật khẩu mới (tùy chọn). */
  password?: string;
};

/** Dữ liệu yêu cầu gửi email đặt lại mật khẩu. */
export type PasswordResetRequestPayload = {
  email: string;
  locale?: string;
};

/** Dữ liệu kiểm tra token đặt lại mật khẩu. */
export type PasswordResetValidatePayload = {
  uid: string;
  token: string;
};

/** Dữ liệu xác nhận đặt lại mật khẩu mới. */
export type PasswordResetConfirmPayload = {
  uid: string;
  token: string;
  new_password: string;
};

/** Phản hồi thông báo từ API đặt lại mật khẩu. */
export type PasswordResetResponse = {
  detail: string;
};

/** Phản hồi kiểm tra tính hợp lệ của token. */
export type PasswordResetTokenValidResponse = {
  valid: boolean;
};

/** Dữ liệu gửi request xác minh email. */
export type VerifyEmailPayload = {
  token: string;
};

/** Dữ liệu phản hồi kiểm tra token lời mời. */
export type InvitationValidateResponse = {
  email: string;
  fullName: string;
  username: string | null;
};

/** Dữ liệu chấp nhận lời mời và kích hoạt tài khoản. */
export type AcceptInvitationPayload = {
  token: string;
  fullName: string;
  username?: string;
  password: string;
};

/** Thông tin tóm tắt trạng thái liên kết mạng xã hội của người dùng. */
export type UserSocialAccountSummary = {
  provider: string;
  isConfigured: boolean;
  isConnected: boolean;
  email: string;
  displayName: string;
  avatarUrl: string;
  connectedAt: string | null;
};

/** URL chuyển hướng OAuth do backend sinh. */
export type SocialAuthUrlResponse = {
  authorizationUrl: string;
};

/** Payload trao đổi mã code OAuth để đăng nhập hoặc liên kết. */
export type SocialAuthCodePayload = {
  code: string;
  redirectUri: string;
};
