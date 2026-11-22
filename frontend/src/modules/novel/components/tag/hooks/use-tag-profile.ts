"use client";

import { useTag } from "../../../hooks/use-tag";

/**
 * Dữ liệu cho `TagProfile` (View đã kiểm quyền đọc trước khi render).
 *
 * @param id - ID thẻ truyện.
 * @returns Query chi tiết thẻ truyện.
 */
export function useTagProfile(id: string) {
  return { query: useTag(id, true) };
}
