/**
 * Giao diện chi tiết tiểu thuyết dành cho độc giả (`/novels/[slug]` | `/truyen/[slug]`).
 *
 * Kiểm tra quyền hạn tiểu thuyết qua NovelGuard và hiển thị component NovelDetail.
 */

"use client";

import { NovelDetail } from "../components/novel-detail";
import { NovelGuard } from "../components/novel-guard";

/**
 * Giao diện hiển thị chi tiết tiểu thuyết và danh sách chương.
 *
 * @param props - Đối tượng chứa `slug` định danh tiểu thuyết.
 * @returns Khối giao diện chi tiết tiểu thuyết được bọc NovelGuard.
 */
export function NovelDetailView({ slug }: { slug: string }) {
  return (
    <NovelGuard>
      <div className="container max-w-6xl py-6 sm:py-10">
        <NovelDetail slug={slug} />
      </div>
    </NovelGuard>
  );
}
