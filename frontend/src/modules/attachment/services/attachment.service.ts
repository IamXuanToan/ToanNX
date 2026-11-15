import { apiClient } from "@/shares/lib/api/api-client";
import { toPaginated } from "@/shares/lib/api/to-paginated";
import type { Paginated } from "@/shares/types/api.types";
import { ATTACHMENT_API_ENDPOINTS } from "../constants/api-endpoints";
import type { Attachment, AttachmentFilters } from "../types/attachment.types";
/** Service tương ứng AttachmentService của backend, không lấy endpoint từ Medoly. */
export const attachmentService = {
  /** @param filters - Tìm kiếm, lọc và phân trang. @param signal - Tín hiệu hủy. @returns Trang file trong phạm vi quyền. */
  async list(filters: AttachmentFilters, signal?: AbortSignal): Promise<Paginated<Attachment>> {
    return toPaginated(
      await apiClient.get<Attachment[]>(ATTACHMENT_API_ENDPOINTS.files, { query: filters, signal }),
    );
  },
  /** @param ids - Các file cần xóa mềm trong cùng transaction. @returns Số file đã xóa. */
  async bulkDelete(ids: string[]): Promise<number> {
    return (await apiClient.post<{ count: number }>(ATTACHMENT_API_ENDPOINTS.bulkDelete, { ids }))
      .data.count;
  },
  /** @param file - File từ thiết bị. @param folderId - Nhóm logic đích nếu có. @returns File đã kiểm tra và lưu. */
  async upload(file: File, folderId?: string | null): Promise<Attachment> {
    const body = new FormData();
    body.append("file", file);
    // FormData đi nguyên trạng, không qua bộ chuyển camelCase của apiClient.
    if (folderId) body.append("folder_id", folderId);
    return (await apiClient.post<Attachment>(ATTACHMENT_API_ENDPOINTS.files, body)).data;
  },
  /** @param id - File trong phạm vi quyền. @returns Thông tin file còn sống. */
  async get(id: string): Promise<Attachment> {
    return (await apiClient.get<Attachment>(ATTACHMENT_API_ENDPOINTS.file(id))).data;
  },
  /** @param id - File cần xóa mềm, không xóa storage vật lý. */
  async remove(id: string): Promise<void> {
    await apiClient.delete(ATTACHMENT_API_ENDPOINTS.file(id));
  },
  /** @param ids - File trong phạm vi quyền. @param folderId - Nhóm đích hoặc null. @returns Số file chuyển nhóm; URL giữ nguyên. */
  async move(ids: string[], folderId: string | null): Promise<number> {
    return (
      await apiClient.post<{ count: number }>(ATTACHMENT_API_ENDPOINTS.bulkUpdate, {
        ids,
        folderId,
      })
    ).data.count;
  },
};

/** @param size - Dung lượng byte. @returns Dung lượng gọn, không làm tròn file nhỏ thành 0 KB. */
export function formatAttachmentSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${Number((size / (1024 * 1024)).toFixed(1))} MB`;
}
