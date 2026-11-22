/**
 * Giao diện màn hình đọc chương truyện (`/novels/[slug]/[chapterNumber]` | `/truyen/[slug]/[chapterNumber]`).
 *
 * Kiểm tra quyền hạn qua NovelGuard và hiển thị component NovelReader.
 */

"use client";

import { NovelGuard } from "../components/novel-guard";
import { NovelReader } from "../components/novel-reader";

/**
 * Giao diện đọc truyện cho độc giả.
 *
 * @param props - Đối tượng chứa `novelSlug` và `chapterNumber`.
 * @returns Khối giao diện đọc truyện được bọc NovelGuard.
 */
export function NovelReaderView({
  novelSlug,
  chapterNumber,
}: {
  novelSlug: string;
  chapterNumber: number | string;
}) {
  return (
    <NovelGuard>
      <NovelReader novelSlug={novelSlug} chapterNumber={chapterNumber} />
    </NovelGuard>
  );
}
