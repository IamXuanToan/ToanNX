/**
 * Hook truy vấn chi tiết một tiểu thuyết trong trang quản trị.
 */

import { useQuery } from "@tanstack/react-query";

import { novelKeys } from "../constants/query-keys";
import { novelService } from "../services/novel.service";
import type { NovelDetail } from "../types/novel.types";

/**
 * Hook truy vấn thông tin chi tiết tiểu thuyết theo ID.
 *
 * @param id - UUID của tiểu thuyết.
 * @param enabled - Điều kiện kích hoạt query.
 * @returns State query thông tin tiểu thuyết.
 */
export function useNovel(id: string, enabled = true) {
  return useQuery<NovelDetail>({
    queryKey: novelKeys.novel.detail(id),
    queryFn: ({ signal }) => novelService.get(id, signal),
    enabled: Boolean(id) && enabled,
  });
}
