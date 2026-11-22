/**
 * Hook truy vấn danh sách tiểu thuyết dành cho trang quản trị hoặc danh mục.
 */

import { useListQuery } from "@/shares/hooks/use-list-query";
import type { Paginated } from "@/shares/types/api.types";

import { novelKeys } from "../constants/query-keys";
import { novelService } from "../services/novel.service";
import type { Novel } from "../types/novel.types";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook truy vấn danh sách tiểu thuyết với các bộ lọc phân trang và tìm kiếm.
 *
 * @param params - Các tham số query (search, status, ordering, page, pageSize,...).
 * @param enabled - Điều kiện kích hoạt query.
 * @returns State query danh sách tiểu thuyết phân trang.
 */
export function useNovels(params?: Record<string, unknown>, enabled = true) {
  const safeParams = params ?? {};
  return useListQuery<Paginated<Novel>>(
    novelKeys.novel.list(safeParams),
    (signal) =>
      novelService.list(safeParams, signal) as Promise<unknown> as Promise<Paginated<Novel>>,
    { enabled },
  );
}
