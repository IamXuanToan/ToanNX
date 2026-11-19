/**
 * Hook truy vấn danh sách tác giả phân trang.
 */

import { useListQuery } from "@/shares/hooks/use-list-query";
import type { Paginated } from "@/shares/types/api.types";

import { novelKeys } from "../constants/query-keys";
import { authorService } from "../services/author.service";
import type { Author } from "../types/author.types";

/**
 * Hook truy vấn danh sách tác giả phân trang theo bộ lọc.
 *
 * @param params - Các tham số query (search, ordering, page, pageSize,...).
 * @param enabled - Điều kiện kích hoạt query.
 * @returns State query danh sách tác giả.
 */
export function useAuthors(params?: Record<string, unknown>, enabled = true) {
  const safeParams = params ?? {};
  return useListQuery<Paginated<Author>>(
    novelKeys.author.list(safeParams),
    (signal) =>
      authorService.list(safeParams, signal) as Promise<unknown> as Promise<Paginated<Author>>,
    { enabled },
  );
}
