/**
 * Hook truy vấn danh sách thể loại phân trang.
 */

import { useListQuery } from "@/shares/hooks/use-list-query";
import type { Paginated } from "@/shares/types/api.types";

import { novelKeys } from "../constants/query-keys";
import { genreService } from "../services/genre.service";
import type { Genre } from "../types/genre.types";

/**
 * Hook truy vấn danh sách thể loại phân trang theo bộ lọc.
 *
 * @param params - Các tham số query (search, ordering, page, pageSize,...).
 * @param enabled - Điều kiện kích hoạt query.
 * @returns State query danh sách thể loại.
 */
export function useGenres(params?: Record<string, unknown>, enabled = true) {
  const safeParams = params ?? {};
  return useListQuery<Paginated<Genre>>(
    novelKeys.genre.list(safeParams),
    (signal) =>
      genreService.list(safeParams, signal) as Promise<unknown> as Promise<Paginated<Genre>>,
    { enabled },
  );
}
