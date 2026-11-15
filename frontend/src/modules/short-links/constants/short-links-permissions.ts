/** Mã quyền Short Links (khớp backend `ShortLinksPermission`). */
export const SHORT_LINKS_PERMISSIONS = {
  read: "short_links.link.read",
  create: "short_links.link.create",
  update: "short_links.link.update",
  delete: "short_links.link.delete",
  manageAll: "short_links.link.manage_all",
} as const;
