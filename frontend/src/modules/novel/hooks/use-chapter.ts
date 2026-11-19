/**
 * Hook truy vấn chi tiết một chương truyện.
 */

import { useQuery } from "@tanstack/react-query";

import { novelKeys } from "../constants/query-keys";
import { chapterService } from "../services/chapter.service";
import type { ChapterDetail } from "../types/novel.types";

/**
 * Hook truy vấn thông tin chi tiết chương theo ID.
 *
 * @param id - UUID của chương.
 * @param enabled - Điều kiện kích hoạt query.
 * @returns State query thông tin chương.
 */
export function useChapter(id: string, enabled = true) {
  return useQuery<ChapterDetail>({
    queryKey: novelKeys.chapter.detail(id),
    queryFn: ({ signal }) => chapterService.get(id, signal),
    enabled: Boolean(id) && enabled,
  });
}
