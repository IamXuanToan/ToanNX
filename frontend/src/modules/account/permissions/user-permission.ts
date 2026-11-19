/**
 * Danh mục quyền hạn đối với tài nguyên Người dùng (User).
 *
 * Khớp chuẩn định danh quyền của backend `UserPermission`.
 */
export const USER_PERMISSIONS = {
  userRead: "account.user.read",
  userCreate: "account.user.create",
  userUpdate: "account.user.update",
  userDelete: "account.user.delete",
} as const;
