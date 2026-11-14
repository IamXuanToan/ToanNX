/** Vai trò rút gọn gắn với người dùng (`GET /iam/users/{id}/roles`, `/auth/me`). */
export type RoleSummary = {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
};

/** Quyền dạng `module.resource.action`. */
export type Permission = {
  id: string;
  code: string;
  module: string;
  resource: string;
  action: string;
  name: string;
  /** Quyền này cho phép làm gì. */
  description: string;
};

/** Vai trò trong danh sách. */
export type Role = {
  id: string;
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
  /** Chính sách tự cấp quyền khi đồng bộ: none | all | read_only. */
  autoGrant: "none" | "all" | "read_only";
  isActive: boolean;
  permissionCount: number;
  userCount: number;
  createdAt: string;
  updatedAt: string;
};

/** Chi tiết vai trò kèm quyền. */
export type RoleDetail = Role & { permissions: Permission[] };

/** Dữ liệu tạo/cập nhật vai trò. */
export type RoleInput = {
  code?: string;
  name: string;
  description?: string;
  isActive?: boolean;
};
