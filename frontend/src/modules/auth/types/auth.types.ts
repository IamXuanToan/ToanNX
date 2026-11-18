import type { AttachmentSummary } from "@/shares/types/attachment.types";

/**
 * Người dùng đang đăng nhập (`/auth/me`). Khai riêng trong `auth` (module nền phía FE) để `auth`
 * không phụ thuộc `account`; hình dạng khớp response của BE.
 */
export type AuthUser = {
  id: string;
  email: string;
  username: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: AttachmentSummary | null;
  isActive: boolean;
  isStaff: boolean;
  isSuperuser: boolean;
  isNovel: boolean;
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

/** Dữ liệu `/auth/me`: người dùng, vai trò và quyền hiệu lực. */
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

/** Dữ liệu cập nhật hồ sơ cá nhân qua PATCH `/auth/me`. */
export type UpdateProfilePayload = {
  /** Email đăng nhập mới (tùy chọn). */
  email?: string;
  /** Tên. */
  firstName?: string;
  /** Họ (và tên đệm). */
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
