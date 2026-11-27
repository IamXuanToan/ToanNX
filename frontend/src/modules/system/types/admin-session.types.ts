/** Trạng thái thực tế của phiên (BE `AuthSessionStatus`). */
export const ADMIN_SESSION_STATUSES = ["ACTIVE", "REVOKED", "EXPIRED"] as const;

/** Phiên đăng nhập trong danh sách quản trị; không chứa token hay giá trị băm. */
export type AdminSession = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userUsername: string | null;
  userIsSuperuser: boolean;
  userAgent: string;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  revokedAt: string | null;
  isCurrent: boolean;
  status: (typeof ADMIN_SESSION_STATUSES)[number];
};

/** Bộ lọc phiên của mọi người dùng. */
export type AdminSessionFilters = {
  search?: string;
  /** Chọn nhiều trạng thái. */
  status?: AdminSession["status"][];
  user?: string[];
  ordering?: string;
  page: number;
  pageSize: number;
};

/** Người có phiên trong danh mục lọc; không phải dữ liệu hồ sơ tài khoản. */
export type AdminSessionUser = {
  id: string;
  email: string;
  username: string | null;
  fullName: string;
};
