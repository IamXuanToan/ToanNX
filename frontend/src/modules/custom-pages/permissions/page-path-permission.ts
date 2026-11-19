/**
 * Quyền hạn đối với tài nguyên Đường dẫn trang (PagePath).
 *
 * Khớp chuẩn backend `PagePathPermission`.
 */
export const PAGE_PATH_PERMISSIONS = {
  pathRead: "custom_pages.path.read",
  pathCreate: "custom_pages.path.create",
  pathUpdate: "custom_pages.path.update",
  pathDelete: "custom_pages.path.delete",
} as const;
