"use client";

import { useGenre } from "../../../hooks/use-genre";

/**
 * Dữ liệu cho `GenreProfile` (View đã kiểm quyền đọc trước khi render).
 *
 * @param id - ID thể loại.
 * @returns Query chi tiết thể loại.
 */
export function useGenreProfile(id: string) {
  return { query: useGenre(id, true) };
}
