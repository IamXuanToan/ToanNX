"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { pagePathKeys } from "../constants/query-keys";
import { pagePathService } from "../services/page-path.service";
import type { PagePathFilters } from "../types/page-path.types";

/**
 * Danh sách đường dẫn giữa.
 *
 * @param filters - Bộ lọc và phân trang.
 * @returns Truy vấn danh sách đường dẫn giữa.
 */
export function usePagePaths(filters: PagePathFilters) {
  return useListQuery(pagePathKeys.list(filters), (signal) =>
    pagePathService.list(filters, signal),
  );
}
