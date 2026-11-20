import type { AttachmentSummary } from "@/shares/types/attachment.types";

/** Người dùng (không bao giờ có mật khẩu; vai trò lấy ở API IAM `/system/users/{id}/roles`). */
export type User = {
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
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarId?: string | null;
  isActive?: boolean;
  isStaff?: boolean;
  isSuperuser?: boolean;
  isNovel?: boolean;
};

/** Dữ liệu cập nhật người dùng. */
export type UpdateUserInput = Partial<CreateUserInput>;
