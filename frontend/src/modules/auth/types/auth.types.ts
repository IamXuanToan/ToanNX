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
