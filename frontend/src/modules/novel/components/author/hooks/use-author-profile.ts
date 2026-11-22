"use client";

import { useAuthor } from "../../../hooks/use-author";

/**
 * Dữ liệu cho `AuthorProfile` (View đã kiểm quyền đọc trước khi render).
 *
 * @param id - ID tác giả.
 * @returns Query chi tiết tác giả.
 */
export function useAuthorProfile(id: string) {
  return { query: useAuthor(id, true) };
}
