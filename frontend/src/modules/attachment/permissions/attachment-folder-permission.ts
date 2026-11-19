/**
 * Quyền hạn đối với tài nguyên Thư mục (AttachmentFolder).
 *
 * Khớp chuẩn định danh quyền của backend `AttachmentFolderPermission`.
 */
export const ATTACHMENT_FOLDER_PERMISSIONS = {
  folderRead: "attachment.folder.read",
  folderCreate: "attachment.folder.create",
  folderUpdate: "attachment.folder.update",
  folderDelete: "attachment.folder.delete",
} as const;
