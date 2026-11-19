/**
 * Quyền hạn đối với tài nguyên tệp tin (Attachment).
 *
 * Khớp chuẩn định danh quyền của backend `AttachmentPermission`.
 */
export const ATTACHMENT_PERMISSIONS = {
  read: "attachment.file.read",
  create: "attachment.file.create",
  delete: "attachment.file.delete",
  manageAll: "attachment.file.manage_all",
  update: "attachment.file.update",
} as const;
