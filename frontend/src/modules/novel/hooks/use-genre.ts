/**
 * Hook truy vấn chi tiết một thể loại.
 */

import { useQuery } from "@tanstack/react-query";

import { novelKeys } from "../constants/query-keys";
import { genreService } from "../services/genre.service";
import type { Genre } from "../types/genre.types";

/**
 * Hook truy vấn thông tin chi tiết thể loại theo ID.
 *
 * @param id - UUID của thể loại.
 * @param enabled - Điều kiện kích hoạt query.
 * @returns State query thông tin thể loại.
 */
export function useGenre(id: string, enabled = true) {
  return useQuery<Genre>({
    queryKey: novelKeys.genre.detail(id),
    queryFn: ({ signal }) => genreService.get(id, signal),
    enabled: Boolean(id) && enabled,
  });
}
