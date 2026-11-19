/**
 * Hook truy vấn chi tiết nội dung chương truyện theo slug và số chương.
 */

import { useQuery } from "@tanstack/react-query";

import { novelKeys } from "../constants/query-keys";
import { chapterService } from "../services/chapter.service";
import type { ChapterDetail } from "../types/chapter.types";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook lấy nội dung chương cho màn đọc của độc giả.
 *
 * @param novelSlug - Slug của tiểu thuyết.
 * @param chapterNumber - Số thứ tự chương.
 * @returns Query state chứa dữ liệu `ChapterDetail`.
 */
export function useClientChapter(novelSlug: string, chapterNumber: number | string) {
  return useQuery<ChapterDetail>({
    queryKey: novelKeys.clientChapter(novelSlug, chapterNumber),
    queryFn: ({ signal }) => chapterService.getClientChapter(novelSlug, chapterNumber, signal),
    enabled: Boolean(novelSlug && chapterNumber),
    staleTime: 60_000,
  });
}
