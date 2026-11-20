/**
 * Danh mục quyền hạn đối với tài nguyên Người dùng (User).
 *
 * Khớp chuẩn định danh quyền của backend `UserPermission`.
 */
export const USER_PERMISSIONS = {
  userRead: "system.user.read",
  userCreate: "system.user.create",
  userUpdate: "system.user.update",
  userDelete: "system.user.delete",
} as const;
