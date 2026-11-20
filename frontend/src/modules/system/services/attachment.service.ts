import { env } from "@/shares/config/env";
import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  Attachment,
  AttachmentFilters,
  AttachmentUploadInput,
  UpdateAttachmentInput,
} from "../types/attachment.types";

const crud = createCrudService<
  Attachment,
  AttachmentFilters,
  AttachmentUploadInput,
  UpdateAttachmentInput
>(SYSTEM_API_ENDPOINTS.attachments);

/** Service tương ứng `AttachmentService` của backend: CRUD chuẩn + upload multipart + chuyển thư mục. */
export const attachmentService = {
  list: crud.list,
  get: crud.get,
  update: crud.update,
  delete: crud.delete,
  history: crud.history,
  /** Xóa mềm nhiều file trong cùng transaction. @returns Số file đã xóa. */
  bulkDelete: crud.bulkDelete,
  /** @param file - File từ thiết bị. @param folderId - Nhóm logic đích nếu có. @returns File đã kiểm tra và lưu. */
  async upload(file: File, folderId?: string | null): Promise<Attachment> {
    const body = new FormData();
    body.append("file", file);
    // FormData đi nguyên trạng, không qua bộ chuyển camelCase của apiClient.
    if (folderId) body.append("folder_id", folderId);
    return (
      await apiClient.post<Attachment>(SYSTEM_API_ENDPOINTS.attachments, body, {
        timeoutMs: env.uploadTimeoutMs,
      })
    ).data;
  },
  /** @param ids - File trong phạm vi quyền. @param folderId - Nhóm đích hoặc null. @returns Số file chuyển nhóm; URL giữ nguyên. */
  move(ids: string[], folderId: string | null): Promise<number> {
    return crud.bulkUpdate(ids, { folderId });
  },
};

/** @param size - Dung lượng byte. @returns Dung lượng gọn, không làm tròn file nhỏ thành 0 KB. */
export function formatAttachmentSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${Number((size / (1024 * 1024)).toFixed(1))} MB`;
}
