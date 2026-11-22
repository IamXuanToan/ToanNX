/**
 * Giao diện xem lịch sử đọc tiểu thuyết của độc giả (`/novels/history` | `/truyen/lich-su`).
 *
 * Kiểm tra quyền hạn qua NovelGuard và hiển thị component ReadingHistory.
 */

"use client";

import { NovelGuard } from "../../components/novel/novel-guard";
import { ReadingHistory } from "../../components/reading-history/reading-history";

/**
 * Giao diện lịch sử đọc tiểu thuyết.
 *
 * @returns Khối giao diện lịch sử đọc truyện được bọc NovelGuard.
 */
export function ReadingHistoryView() {
  return (
    <NovelGuard>
      <div className="container max-w-5xl py-6 sm:py-10">
        <ReadingHistory />
      </div>
    </NovelGuard>
  );
}
