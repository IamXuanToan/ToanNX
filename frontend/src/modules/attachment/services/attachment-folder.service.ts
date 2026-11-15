import { apiClient } from "@/shares/lib/api/api-client";
import { toPaginated } from "@/shares/lib/api/to-paginated";

import { ATTACHMENT_API_ENDPOINTS } from "../constants/api-endpoints";
import type { AttachmentFolder } from "../types/attachment.types";

/** Service khớp AttachmentFolderService; thư mục chỉ là metadata DB. */
export const attachmentFolderService = {
  /** @param scope - Phạm vi người tạo. @param signal - Tín hiệu hủy. @returns Toàn bộ thư mục, không cắt ở trang đầu. */
  async listAll(scope?: readonly string[], signal?: AbortSignal): Promise<AttachmentFolder[]> {
    const items: AttachmentFolder[] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const result = toPaginated(
        await apiClient.get<AttachmentFolder[]>(ATTACHMENT_API_ENDPOINTS.folders, {
          query: { page, pageSize: 100, ordering: "-created_at", scope },
          signal,
        }),
      );
      items.push(...result.items);
      totalPages = result.pagination.totalPages;
      page += 1;
    } while (page <= totalPages);
    return items;
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
