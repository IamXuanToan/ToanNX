/**
 * Quyền hạn đối với tài nguyên Thư mục (AttachmentFolder).
 *
 * Khớp chuẩn định danh quyền của backend `AttachmentFolderPermission`.
 */
export const ATTACHMENT_FOLDER_PERMISSIONS = {
  folderRead: "system.attachment_folder.read",
  folderCreate: "system.attachment_folder.create",
  folderUpdate: "system.attachment_folder.update",
  folderDelete: "system.attachment_folder.delete",
} as const;
