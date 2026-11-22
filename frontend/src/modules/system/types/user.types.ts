import type { AttachmentSummary } from "@/shares/types/attachment.types";

/** Thông tin tài khoản mạng xã hội liên kết của người dùng. */
export type UserConnectedSocial = {
  id?: string;
  provider: string;
  uid?: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt?: string;
};

/** Người dùng (không bao giờ có mật khẩu; vai trò lấy ở API IAM `/system/users/{id}/roles`). */
export type User = {
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
  socialAccounts: UserConnectedSocial[];
  lastLogin: string | null;
  /** Hoạt động gần nhất (đăng nhập hoặc gọi API), BE ghi tối đa mỗi phút. */
  lastSeenAt: string | null;
  dateJoined: string;
  createdAt: string;
  updatedAt: string;
};

/** Loại truy cập dùng để lọc (BE `access`). */
export const USER_ACCESS_VALUES = ["superuser", "staff", "novel"] as const;
export type UserAccess = (typeof USER_ACCESS_VALUES)[number];

/** Bộ lọc danh sách người dùng. */
export type UserFilters = {
  /** Từ khóa tìm kiếm (DRF SearchFilter: email, username, họ tên). */
  search?: string;
  /** Trạng thái hoạt động (chọn nhiều: `["true", "false"]`). */
  isActive?: ("true" | "false")[];
  /** Id các vai trò được gán (có ít nhất một). */
  role?: string[];
  /** Loại truy cập (khớp một trong các loại). */
  access?: UserAccess[];
  /** Sắp xếp theo cú pháp DRF (`email`, `-last_login`). */
  ordering?: string;
  page: number;
  pageSize: number;
};

/** Dữ liệu tạo người dùng. */
export type CreateUserInput = {
  email: string;
  password?: string;
  sendInvitation?: boolean;
  username?: string;
  fullName?: string;
  avatarId?: string | null;
  isActive?: boolean;
  isStaff?: boolean;
  isSuperuser?: boolean;
  isNovel?: boolean;
};

/** Dữ liệu cập nhật người dùng (không bao gồm sendInvitation vì chỉ áp dụng khi tạo mới). */
export type UpdateUserInput = Omit<Partial<CreateUserInput>, "sendInvitation">;
