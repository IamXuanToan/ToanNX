/**
 * Giao diện danh mục tiểu thuyết công khai (`/novels` | `/truyen`).
 *
 * Kiểm tra quyền hạn người dùng qua NovelGuard và hiển thị component NovelCatalog.
 */

"use client";

import { NovelCatalog } from "../components/novel-catalog/novel-catalog";
import { NovelGuard } from "../components/novel-guard/novel-guard";

/**
 * Giao diện danh mục tiểu thuyết công khai dành cho độc giả.
 *
 * @returns Khối giao diện danh mục được bọc NovelGuard.
 */
export function NovelListView() {
  return (
    <NovelGuard>
      <div className="container max-w-6xl py-6 sm:py-10">
        <NovelCatalog />
      </div>
    </NovelGuard>
  );
}
