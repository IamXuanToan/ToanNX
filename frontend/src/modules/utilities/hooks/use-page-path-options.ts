"use client";

import { useQuery } from "@tanstack/react-query";

import { pagePathKeys } from "../constants/query-keys";
import { pagePathService } from "../services/page-path.service";

/**
 * Toàn bộ đường dẫn giữa cho ô chọn (không phân trang).
 *
 * @param enabled - Có quyền xem.
 * @returns Danh mục đường dẫn giữa cho options.
 */
export function usePagePathOptions(enabled = true) {
  return useQuery({
    queryKey: pagePathKeys.options(),
    queryFn: ({ signal }) => pagePathService.listAll({ ordering: "position" }, signal),
    enabled,
  });
}
