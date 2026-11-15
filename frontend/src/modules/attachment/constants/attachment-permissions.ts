/** Quyền tương ứng catalog Attachment ở backend. */
export const ATTACHMENT_PERMISSIONS = {
  read: "attachment.file.read",
  create: "attachment.file.create",
  delete: "attachment.file.delete",
  manageAll: "attachment.file.manage_all",
  update: "attachment.file.update",
  folderRead: "attachment.folder.read",
  folderCreate: "attachment.folder.create",
  folderUpdate: "attachment.folder.update",
  folderDelete: "attachment.folder.delete",
} as const;
