/**
 * Danh mục quyền hạn đối với tài nguyên Liên kết rút gọn (ShortLink).
 *
 * Khớp backend `ShortLinkPermission`.
 */
export const SHORT_LINK_PERMISSIONS = {
  read: "short_links.link.read",
  create: "short_links.link.create",
  update: "short_links.link.update",
  delete: "short_links.link.delete",
  manageAll: "short_links.link.manage_all",
} as const;
