import type { FolderCapabilities } from "./attachment-folder.types";

export type Attachment = {
  id: string;
  url: string;
  originalName: string;
  altText: string;
  contentType: string;
  size: number;
  createdAt: string;
  createdById: string | null;
  uploaderName: string;
  folderId: string | null;
  folderName: string;
};

/** Dữ liệu cập nhật tệp (đổi tên, văn bản thay thế alt text, chuyển thư mục). */
export type UpdateAttachmentInput = {
  originalName?: string;
  altText?: string;
  folderId?: string | null;
};

/** Bộ lọc thư viện; mảng gửi qua API dưới dạng phân tách dấu phẩy. */
export type AttachmentFilters = {
  search?: string;
  page?: number;
  pageSize?: number;
  ordering?: string;
  kind?: readonly string[];
  scope?: readonly string[];
  contentType?: readonly string[];
  folder?: readonly string[];
};

/** Các quyền giao diện do view quyết định. */
export type AttachmentCapabilities = {
  canRead: boolean;
  canUpload: boolean;
  canDelete: boolean;
  canManageAll: boolean;
  canMove?: boolean;
  folders?: FolderCapabilities;
};

/** Dữ liệu upload tùy chọn thư mục, giữ tương thích với upload trực tiếp từ ô ảnh. */
export type AttachmentUploadInput = { file: File; folderId?: string | null };
