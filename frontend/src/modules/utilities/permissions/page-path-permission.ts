/**
 * Quyền hạn đối với tài nguyên Đường dẫn trang (PagePath).
 *
 * Khớp chuẩn backend `PagePathPermission`.
 */
export const PAGE_PATH_PERMISSIONS = {
  read: "utilities.page_path.read",
  create: "utilities.page_path.create",
  update: "utilities.page_path.update",
  delete: "utilities.page_path.delete",
} as const;
