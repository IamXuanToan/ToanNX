/**
 * Hook truy vấn danh sách chương truyện.
 */

import { useListQuery } from "@/shares/hooks/use-list-query";

import { novelKeys } from "../constants/query-keys";
import { chapterService } from "../services/chapter.service";
import type { ChapterListItem } from "../types/chapter.types";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook truy vấn danh sách chương truyện với các bộ lọc phân trang và tìm kiếm.
 *
 * @param params - Các tham số query (novel_id, novel_slug, search, ordering, page, pageSize,...).
 * @param enabled - Điều kiện kích hoạt query.
 * @returns State query danh sách chương truyện.
 */
export function useChapters(params?: Record<string, unknown>, enabled = true) {
  const safeParams = params ?? {};
  return useListQuery<ChapterListItem[]>(
    novelKeys.chapter.list(safeParams),
    (signal) =>
      chapterService.list(safeParams, signal) as Promise<unknown> as Promise<ChapterListItem[]>,
    { enabled },
  );
}
