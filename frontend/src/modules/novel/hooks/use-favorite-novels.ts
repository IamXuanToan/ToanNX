/**
 * Hook truy vấn danh sách tiểu thuyết yêu thích của độc giả.
 */

import { useQuery } from "@tanstack/react-query";

import { novelKeys } from "../constants/query-keys";
import { favoriteService } from "../services/favorite.service";
import type { FavoriteItem } from "../types/favorite.types";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook lấy danh sách truyện yêu thích của độc giả hiện tại.
 *
 * @returns Query state chứa mảng `FavoriteItem`.
 */
export function useFavoriteNovels() {
  return useQuery<FavoriteItem[]>({
    queryKey: novelKeys.favorites(),
    queryFn: ({ signal }) => favoriteService.getFavorites(signal),
    staleTime: 30_000,
  });
}
