/**
 * Quyền hạn đối với tài nguyên Trang tùy chỉnh (Page).
 *
 * Khớp chuẩn backend `PagePermission`.
 */
export const PAGE_PERMISSIONS = {
  read: "custom_pages.page.read",
  create: "custom_pages.page.create",
  update: "custom_pages.page.update",
  delete: "custom_pages.page.delete",
  manageAll: "custom_pages.page.manage_all",
} as const;
