/**
 * Hook truy vấn danh sách thẻ phân loại phân trang.
 */

import { useListQuery } from "@/shares/hooks/use-list-query";
import type { Paginated } from "@/shares/types/api.types";

import { novelKeys } from "../constants/query-keys";
import { tagService } from "../services/tag.service";
import type { Tag } from "../types/tag.types";

/**
 * Hook truy vấn danh sách thẻ phân loại phân trang theo bộ lọc.
 *
 * @param params - Các tham số query (search, ordering, page, pageSize,...).
 * @param enabled - Điều kiện kích hoạt query.
 * @returns State query danh sách thẻ.
 */
export function useTags(params?: Record<string, unknown>, enabled = true) {
  const safeParams = params ?? {};
  return useListQuery<Paginated<Tag>>(
    novelKeys.tag.list(safeParams),
    (signal) =>
      tagService.list(safeParams, signal) as Promise<unknown> as Promise<Paginated<Tag>>,
    { enabled },
  );
}
