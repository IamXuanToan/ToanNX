/**
 * Quyền hạn đối với tài nguyên Trang tùy chỉnh (Page).
 *
 * Khớp chuẩn backend `PagePermission`.
 */
export const PAGE_PERMISSIONS = {
  read: "utilities.page.read",
  create: "utilities.page.create",
  update: "utilities.page.update",
  delete: "utilities.page.delete",
  manageAll: "utilities.page.manage_all",
} as const;
