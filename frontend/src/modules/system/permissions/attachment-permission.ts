/**
 * Quyền hạn đối với tài nguyên tệp tin (Attachment).
 *
 * Khớp chuẩn định danh quyền của backend `AttachmentPermission`.
 */
export const ATTACHMENT_PERMISSIONS = {
  read: "system.attachment.read",
  create: "system.attachment.create",
  delete: "system.attachment.delete",
  manageAll: "system.attachment.manage_all",
  readPrivate: "system.attachment.read_private",
  update: "system.attachment.update",
} as const;
