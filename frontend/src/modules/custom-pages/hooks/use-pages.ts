"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { pageKeys } from "../constants/query-keys";
import { pageService } from "../services/page.service";
import type { PageFilters } from "../types/page.types";

/**
 * Danh sách trang tùy chỉnh.
 *
 * @param filters - Bộ lọc và phân trang.
 * @returns Truy vấn danh sách trang.
 */
export function usePages(filters: PageFilters) {
  return useListQuery(pageKeys.list(filters), (signal) => pageService.list(filters, signal));
}
