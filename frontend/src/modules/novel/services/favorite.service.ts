/**
 * Dịch vụ xử lý API liên quan đến Truyện yêu thích (Favorites).
 *
 * Cho phép độc giả theo dõi danh sách tiểu thuyết yêu thích và thực hiện
 * bật/tắt (toggle) trạng thái yêu thích của từng truyện.
 */

import { apiClient } from "@/shares/lib/api/api-client";

import { NOVEL_API_ENDPOINTS } from "../constants/api-endpoints";
import type { FavoriteItem } from "../types/favorite.types";

/**
 * Service quản lý danh sách yêu thích truyện của độc giả.
 */
export const favoriteService = {
  /**
   * Lấy danh sách tiểu thuyết yêu thích của độc giả hiện tại.
   *
   * @param signal - AbortSignal hỗ trợ hủy request khi cần.
   * @returns Danh sách các mục yêu thích.
   */
  async getFavorites(signal?: AbortSignal): Promise<FavoriteItem[]> {
    const response = await apiClient.get<FavoriteItem[]>(NOVEL_API_ENDPOINTS.favorites, {
      signal,
    });
    return response.data;
  },

  /**
   * Bật hoặc tắt trạng thái yêu thích của một tiểu thuyết.
   *
   * @param novelId - ID của tiểu thuyết.
   * @param signal - AbortSignal hỗ trợ hủy request khi cần.
   * @returns Trạng thái mới: `{ isFavorited: boolean }`.
   */
  async toggleFavorite(novelId: string, signal?: AbortSignal): Promise<{ isFavorited: boolean }> {
    const response = await apiClient.post<{ isFavorited: boolean }>(
      NOVEL_API_ENDPOINTS.favoriteToggle,
      { novelId },
      { signal },
    );
    return response.data;
  },
};
