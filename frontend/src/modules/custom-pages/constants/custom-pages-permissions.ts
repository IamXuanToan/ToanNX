/** Mã quyền Custom Pages (khớp backend `CustomPagesPermission`). */
export const CUSTOM_PAGES_PERMISSIONS = {
  read: "custom_pages.page.read",
  create: "custom_pages.page.create",
  update: "custom_pages.page.update",
  delete: "custom_pages.page.delete",
  manageAll: "custom_pages.page.manage_all",
  pathRead: "custom_pages.path.read",
  pathCreate: "custom_pages.path.create",
  pathUpdate: "custom_pages.path.update",
  pathDelete: "custom_pages.path.delete",
} as const;
