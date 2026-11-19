/**
 * Hook quản lý danh sách tiểu thuyết yêu thích và thao tác gỡ yêu thích.
 */

"use client";

import { useFavoriteNovels } from "../../../hooks/use-favorite-novels";
import { useToggleFavorite } from "../../../hooks/use-toggle-favorite";

/**
 * Quản lý danh sách tiểu thuyết yêu thích của độc giả.
 *
 * @returns Danh sách yêu thích, trạng thái tải và hàm bật/tắt yêu thích.
 */
export function useNovelFavoritesComponent() {
  const query = useFavoriteNovels();
  const toggleFavorite = useToggleFavorite();

  return {
    favoriteList: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    toggleFavorite: (novelId: string) => toggleFavorite.mutate(novelId),
    isToggling: toggleFavorite.isPending,
  };
}
