"use client";

import { useChapter } from "../../../hooks/use-chapter";

/**
 * Dữ liệu cho `ChapterProfile` (View đã kiểm quyền đọc trước khi render).
 *
 * @param id - ID chương truyện.
 * @returns Query chi tiết chương truyện.
 */
export function useChapterProfile(id: string) {
  return { query: useChapter(id, true) };
}
