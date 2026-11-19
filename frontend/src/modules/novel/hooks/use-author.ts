/**
 * Hook truy vấn chi tiết một tác giả.
 */

import { useQuery } from "@tanstack/react-query";

import { novelKeys } from "../constants/query-keys";
import { authorService } from "../services/author.service";
import type { Author } from "../types/author.types";

/**
 * Hook truy vấn thông tin chi tiết một tác giả theo ID.
 *
 * @param id - UUID của tác giả.
 * @param enabled - Điều kiện kích hoạt query.
 * @returns State query thông tin tác giả.
 */
export function useAuthor(id: string, enabled = true) {
  return useQuery<Author>({
    queryKey: novelKeys.author.detail(id),
    queryFn: ({ signal }) => authorService.get(id, signal),
    enabled: Boolean(id) && enabled,
  });
}
