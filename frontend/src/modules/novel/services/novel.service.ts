/**
 * Dịch vụ xử lý API liên quan đến Tiểu thuyết (Novel).
 *
 * Cung cấp các thao tác CRUD quản trị danh sách truyện, lấy dữ liệu độc giả chi tiết,
 * tải mẫu file import và thực hiện import dữ liệu truyện cấu trúc JSON.
 */

import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { NOVEL_API_ENDPOINTS } from "../constants/api-endpoints";
import type { NovelImportPayload, NovelImportResult } from "../types/novel-import.types";
import type { Novel, NovelClientDetail, NovelDetail } from "../types/novel.types";

// ============================================================================
// CRUD SERVICE
// ============================================================================

const crud = createCrudService<
  Novel,
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>,
  NovelDetail
>(NOVEL_API_ENDPOINTS.novels);

// ============================================================================
// EXTENDED SERVICE METHODS
// ============================================================================

/**
 * Service quản lý tài nguyên Tiểu thuyết.
 */
export const novelService = {
  ...crud,

  /**
   * Lấy thông tin chi tiết tiểu thuyết dành cho giao diện độc giả.
   *
   * Bao gồm các cờ hiển thị: đã thích hay chưa, danh sách các số chương đã đọc,
   * chương đọc gần nhất và chương đầu tiên để độc giả bắt đầu đọc ngay.
   *
   * @param slug - Slug định danh của tiểu thuyết.
   * @param signal - AbortSignal hỗ trợ hủy request khi cần.
   * @returns Dữ liệu `NovelClientDetail`.
   */
  async getClientNovel(slug: string, signal?: AbortSignal): Promise<NovelClientDetail> {
    const response = await apiClient.get<NovelClientDetail>(NOVEL_API_ENDPOINTS.clientNovel(slug), {
      signal,
    });
    return response.data;
  },

  /**
   * Tải template mẫu cấu trúc JSON dùng để nhập khẩu (import) tiểu thuyết hàng loạt.
   *
   * @param signal - AbortSignal hỗ trợ hủy request khi cần.
   * @returns Template mẫu JSON.
   */
  async getImportTemplate(signal?: AbortSignal): Promise<Record<string, unknown>> {
    const response = await apiClient.get<Record<string, unknown>>(
      NOVEL_API_ENDPOINTS.importTemplate,
      { signal },
    );
    return response.data;
  },

  /**
   * Thực hiện nhập khẩu một tiểu thuyết kèm danh sách các chương từ payload JSON.
   *
   * @param payload - Dữ liệu truyện và các chương cần import.
   * @param signal - AbortSignal hỗ trợ hủy request khi cần.
   * @returns Kết quả nhập khẩu gồm ID truyện, slug và số lượng chương đã tạo.
   */
  async importNovel(payload: NovelImportPayload, signal?: AbortSignal): Promise<NovelImportResult> {
    const response = await apiClient.post<NovelImportResult>(
      NOVEL_API_ENDPOINTS.importNovel,
      payload,
      { signal },
    );
    return response.data;
  },
};
