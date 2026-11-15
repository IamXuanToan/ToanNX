import { apiClient } from "@/shares/lib/api/api-client";

import { ATTACHMENT_API_ENDPOINTS } from "../constants/api-endpoints";
import type { AttachmentFolder } from "../types/attachment.types";

/** Service khớp AttachmentFolderService; thư mục chỉ là metadata DB. */
export const attachmentFolderService = {
  /** @param scope - Phạm vi người tạo. @param signal - Tín hiệu hủy. @returns Toàn bộ thư mục, không cắt ở trang đầu. */
  async listAll(scope?: readonly string[], signal?: AbortSignal): Promise<AttachmentFolder[]> {
    // Không truyền `page` → BE trả toàn bộ thư mục trong phạm vi.
    return (
      await apiClient.get<AttachmentFolder[]>(ATTACHMENT_API_ENDPOINTS.folders, {
        query: { ordering: "-created_at", scope },
        signal,
      })
    ).data;
  },
  /** @param data - Tên và cha của thư mục. @returns Nhóm của người đang đăng nhập. */
  async create(data: { name: string; parentId: string | null }): Promise<AttachmentFolder> {
    return (await apiClient.post<AttachmentFolder>(ATTACHMENT_API_ENDPOINTS.folders, data)).data;
  },
  /** @param id - Thư mục cần sửa. @param data - Tên và cha mới. @returns Nhóm đã cập nhật. */
  async update(
    id: string,
    data: { name: string; parentId: string | null },
  ): Promise<AttachmentFolder> {
    return (await apiClient.patch<AttachmentFolder>(ATTACHMENT_API_ENDPOINTS.folder(id), data))
      .data;
  },
  /** @param options - Nhánh cần xóa mềm và lựa chọn giữ hay xóa mềm file bên trong. */
  async remove({ id, deleteFiles }: { id: string; deleteFiles: boolean }): Promise<void> {
    await apiClient.post(ATTACHMENT_API_ENDPOINTS.folderDelete(id), { deleteFiles });
  },
};
