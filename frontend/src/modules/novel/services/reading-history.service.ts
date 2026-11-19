/**
 * Dịch vụ xử lý API liên quan đến Lịch sử đọc truyện (Reading History).
 *
 * Cung cấp các thao tác ghi nhận tiến độ đọc chương, xem danh sách lịch sử,
 * xóa từng mục lịch sử hoặc xóa toàn bộ lịch sử đọc của độc giả.
 */

import { apiClient } from "@/shares/lib/api/api-client";

import { NOVEL_API_ENDPOINTS } from "../constants/api-endpoints";
import type { ReadingHistoryItem } from "../types/reading-history.types";

/**
 * Service quản lý lịch sử đọc truyện của độc giả.
 */
export const readingHistoryService = {
  /**
   * Lấy danh sách lịch sử đọc truyện của độc giả hiện tại.
   *
   * @param signal - AbortSignal hỗ trợ hủy request khi cần.
   * @returns Danh sách lịch sử đọc truyện.
   */
  async getHistory(signal?: AbortSignal): Promise<ReadingHistoryItem[]> {
    const response = await apiClient.get<ReadingHistoryItem[]>(NOVEL_API_ENDPOINTS.readingHistory, {
      signal,
    });
    return response.data;
  },

  /**
   * Ghi nhận hoặc cập nhật tiến độ đọc chương mới nhất của độc giả.
   *
   * @param novelId - ID tiểu thuyết đã đọc.
   * @param chapterId - ID chương vừa đọc.
   * @param signal - AbortSignal hỗ trợ hủy request khi cần.
   * @returns Bản ghi lịch sử đọc vừa tạo hoặc cập nhật.
   */
  async recordHistory(
    novelId: string,
    chapterId: string,
    signal?: AbortSignal,
  ): Promise<ReadingHistoryItem> {
    const response = await apiClient.post<ReadingHistoryItem>(
      NOVEL_API_ENDPOINTS.readingHistory,
      { novelId, chapterId },
      { signal },
    );
    return response.data;
  },

  /**
   * Xóa một bản ghi lịch sử đọc cụ thể theo ID.
   *
   * @param historyId - ID của bản ghi lịch sử đọc cần xóa.
   * @param signal - AbortSignal hỗ trợ hủy request khi cần.
   */
  async deleteHistoryItem(historyId: string, signal?: AbortSignal): Promise<void> {
    await apiClient.delete(NOVEL_API_ENDPOINTS.readingHistoryItem(historyId), { signal });
  },

  /**
   * Xóa toàn bộ lịch sử đọc truyện của độc giả hiện tại.
   *
   * @param signal - AbortSignal hỗ trợ hủy request khi cần.
   */
  async clearAllHistory(signal?: AbortSignal): Promise<void> {
    await apiClient.delete(NOVEL_API_ENDPOINTS.readingHistory, { signal });
  },
};
