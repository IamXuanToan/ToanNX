import type { AttachmentSummary } from "@/shares/types/attachment.types";

/** Người dùng (không bao giờ có mật khẩu; vai trò lấy ở module IAM). */
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
  dateJoined: string;
  createdAt: string;
  updatedAt: string;
};

/** Bộ lọc danh sách người dùng. */
export type UserFilters = {
  /** Từ khóa tìm kiếm (DRF SearchFilter: email, username, họ tên). */
  search?: string;
  isActive?: boolean;
  page: number;
  pageSize: number;
};

/** Dữ liệu tạo người dùng. */
export type CreateUserInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  isStaff: boolean;
  isNovel: boolean;
};

/** Dữ liệu cập nhật người dùng. */
export type UpdateUserInput = Partial<Omit<CreateUserInput, "password">> & {
  password?: string;
  isSuperuser?: boolean;
};
