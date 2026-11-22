/**
 * Giao diện danh sách tiểu thuyết yêu thích của độc giả (`/novels/favorites` | `/truyen/yeu-thich`).
 *
 * Kiểm tra quyền hạn qua NovelGuard và hiển thị component NovelFavorites.
 */

"use client";

import { NovelFavorites } from "../components/novel-favorites";
import { NovelGuard } from "../components/novel-guard";

/**
 * Giao diện tiểu thuyết yêu thích của người dùng.
 *
 * @returns Khối giao diện tiểu thuyết yêu thích được bọc NovelGuard.
 */
export function NovelFavoritesView() {
  return (
    <NovelGuard>
      <div className="container max-w-6xl py-6 sm:py-10">
        <NovelFavorites />
      </div>
    </NovelGuard>
  );
}
