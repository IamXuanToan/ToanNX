/**
 * Dịch vụ xử lý API liên quan đến Tiểu thuyết (Novel).
 *
 * Cung cấp các thao tác CRUD quản trị danh sách truyện, lấy dữ liệu độc giả chi tiết,
 * tải mẫu file import và thực hiện import dữ liệu truyện cấu trúc JSON.
 */

import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import type { ListParams } from "@/shares/types/api.types";

import { NOVEL_API_ENDPOINTS } from "../constants/api-endpoints";
import type { NovelImportPayload, NovelImportResult } from "../types/novel-import.types";
import type {
  Novel,
  NovelClientDetail,
  NovelCreateInput,
  NovelDetail,
  NovelUpdateInput,
} from "../types/novel.types";

// ============================================================================
// CRUD SERVICE
// ============================================================================

const crud = createCrudService<
  Novel,
  ListParams,
  NovelCreateInput,
  NovelUpdateInput,
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
   * Thực hiện nhập khẩu toàn bộ dữ liệu truyện (tiêu đề, tác giả, thể loại, chương...).
   *
   * @param payload - Nội dung truyện dạng JSON theo đúng schema mẫu.
   * @returns Kết quả import gồm ID, slug truyện và số lượng chương đã nạp thành công.
   */
  async importNovel(payload: NovelImportPayload): Promise<NovelImportResult> {
    const response = await apiClient.post<NovelImportResult>(
      NOVEL_API_ENDPOINTS.importNovel,
      payload,
    );
    return response.data;
  },
};
