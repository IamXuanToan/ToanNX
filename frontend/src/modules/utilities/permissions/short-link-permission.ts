/**
 * Danh mục quyền hạn đối với tài nguyên Liên kết rút gọn (ShortLink).
 *
 * Khớp backend `ShortLinkPermission`.
 */
export const SHORT_LINK_PERMISSIONS = {
  read: "utilities.short_link.read",
  create: "utilities.short_link.create",
  update: "utilities.short_link.update",
  delete: "utilities.short_link.delete",
  manageAll: "utilities.short_link.manage_all",
} as const;
