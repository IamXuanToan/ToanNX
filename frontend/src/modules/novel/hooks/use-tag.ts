/**
 * Hook truy vấn chi tiết một thẻ phân loại.
 */

import { useQuery } from "@tanstack/react-query";

import { novelKeys } from "../constants/query-keys";
import { tagService } from "../services/tag.service";
import type { Tag } from "../types/tag.types";

/**
 * Hook truy vấn thông tin chi tiết thẻ theo ID.
 *
 * @param id - UUID của thẻ.
 * @param enabled - Điều kiện kích hoạt query.
 * @returns State query thông tin thẻ.
 */
export function useTag(id: string, enabled = true) {
  return useQuery<Tag>({
    queryKey: novelKeys.tag.detail(id),
    queryFn: ({ signal }) => tagService.get(id, signal),
    enabled: Boolean(id) && enabled,
  });
}
