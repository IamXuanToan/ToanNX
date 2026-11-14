import { API_ENDPOINTS } from "@/shares/constants/api-endpoints";
import { apiClient } from "@/shares/lib/api/api-client";

import type { Attachment } from "../types/attachment.types";

/** Gọi API Attachment. */
export const attachmentRepository = {
  /**
   * Upload một file (multipart). Backend tự nhận diện kiểu file và kiểm tra SVG an toàn.
   *
   * @param file - File người dùng chọn.
   * @returns File đã lưu.
   */
  async upload(file: File): Promise<Attachment> {
    const body = new FormData();
    body.append("file", file);
    return (await apiClient.post<Attachment>(API_ENDPOINTS.attachment.list, body)).data;
  },
};
