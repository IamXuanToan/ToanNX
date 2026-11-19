/**
 * Kiểu dữ liệu và năng lực thao tác với Thư mục Attachment (AttachmentFolder).
 */

/** Quyền quản lý nhóm logic do view kiểm tra. */
export type FolderCapabilities = {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canDeleteFiles?: boolean;
};

/** Thư mục logic; không chứa đường dẫn filesystem. */
export type AttachmentFolder = {
  id: string;
  name: string;
  parentId: string | null;
  fileCount: number;
  createdById: string | null;
  createdAt: string;
};
