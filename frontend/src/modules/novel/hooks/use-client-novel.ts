/**
 * Hook truy vấn chi tiết tiểu thuyết dành riêng cho màn hình độc giả.
 */

import { useQuery } from "@tanstack/react-query";

import { novelKeys } from "../constants/query-keys";
import { novelService } from "../services/novel.service";
import type { NovelClientDetail } from "../types/novel.types";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook lấy dữ liệu chi tiết tiểu thuyết cho độc giả.
 *
 * @param slug - Slug của tiểu thuyết.
 * @returns Query state chứa dữ liệu `NovelClientDetail`.
 */
export function useClientNovel(slug: string) {
  return useQuery<NovelClientDetail>({
    queryKey: novelKeys.clientNovel(slug),
    queryFn: ({ signal }) => novelService.getClientNovel(slug, signal),
    enabled: Boolean(slug),
    staleTime: 30_000,
  });
}
