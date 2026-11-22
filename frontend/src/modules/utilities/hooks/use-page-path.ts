"use client";

import { useQuery } from "@tanstack/react-query";

import { pagePathKeys } from "../constants/query-keys";
import { pagePathService } from "../services/page-path.service";

/**
 * Lấy chi tiết một đường dẫn giữa.
 *
 * @param id - Id đường dẫn giữa.
 * @param enabled - Tải khi cần.
 * @returns Truy vấn React Query chi tiết đường dẫn giữa.
 */
export function usePagePath(id: string, enabled = true) {
  return useQuery({
    queryKey: pagePathKeys.detail(id),
    queryFn: ({ signal }) => pagePathService.get(id, signal),
    enabled,
  });
}
