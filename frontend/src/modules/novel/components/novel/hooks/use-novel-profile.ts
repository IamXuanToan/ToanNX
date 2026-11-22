"use client";

import { useNovel } from "../../../hooks/use-novel";

/**
 * Dữ liệu cho `NovelProfile` (View đã kiểm quyền đọc trước khi render).
 *
 * @param id - ID tiểu thuyết.
 * @returns Query chi tiết tiểu thuyết.
 */
export function useNovelProfile(id: string) {
  return { query: useNovel(id, true) };
}
