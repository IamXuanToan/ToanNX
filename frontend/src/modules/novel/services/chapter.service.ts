/**
 * Dịch vụ xử lý API liên quan đến Chương truyện (Chapter).
 *
 * Cung cấp các thao tác CRUD quản trị cùng các phương thức chuyên biệt cho phía độc giả:
 * đọc nội dung chi tiết chương và lấy danh sách chương của một tiểu thuyết.
 */

import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import type { ListParams } from "@/shares/types/api.types";

import { NOVEL_API_ENDPOINTS } from "../constants/api-endpoints";
import type { ChapterCreateInput, ChapterDetail, ChapterListItem, ChapterUpdateInput } from "../types/novel.types";

const crud = createCrudService<
  ChapterListItem,
  ListParams,
  ChapterCreateInput,
  ChapterUpdateInput,
  ChapterDetail
>(NOVEL_API_ENDPOINTS.chapters);

/**
 * Service quản lý tài nguyên Chương truyện.
 */
export const chapterService = {
  ...crud,

  /**
   * Lấy thông tin chi tiết và nội dung của một chương truyện cho màn đọc.
   *
   * Tự động kích hoạt cơ chế ghi nhận lịch sử đọc ở backend cho người dùng hiện tại.
   *
   * @param novelSlug - Slug của tiểu thuyết chứa chương.
   * @param chapterNumber - Số thứ tự chương (bắt đầu từ 1).
   * @param signal - AbortSignal hỗ trợ hủy request khi người dùng chuyển trang.
   * @returns Dữ liệu `ChapterDetail` gồm nội dung văn bản, tiêu đề, số từ và thông tin chương liền trước/sau.
   */
  async getClientChapter(
    novelSlug: string,
    chapterNumber: number | string,
    signal?: AbortSignal,
  ): Promise<ChapterDetail> {
    const response = await apiClient.get<ChapterDetail>(
      NOVEL_API_ENDPOINTS.clientChapter(novelSlug, chapterNumber),
      { signal },
    );
    return response.data;
  },

  /**
   * Lấy danh sách toàn bộ chương của một tiểu thuyết theo thứ tự chương tăng dần.
   *
   * @param novelId - ID của tiểu thuyết cần lấy danh sách chương.
   * @param signal - AbortSignal hỗ trợ hủy request khi cần.
   * @returns Mảng danh sách tóm tắt các chương `ChapterListItem[]`.
   */
  async listForNovel(novelId: string, signal?: AbortSignal): Promise<ChapterListItem[]> {
    const response = await apiClient.get<{ results: ChapterListItem[] } | ChapterListItem[]>(
      `${NOVEL_API_ENDPOINTS.chapters}?novel=${novelId}&ordering=chapter_number&page_size=1000`,
      { signal },
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return (response.data as { results: ChapterListItem[] })?.results ?? [];
  },
};
