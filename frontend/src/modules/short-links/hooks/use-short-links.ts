"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { shortLinkKeys } from "../constants/query-keys";
import { shortLinkService } from "../services/short-link.service";
import type { ShortLinkFilters } from "../types/short-link.types";

/**
 * Lấy danh sách liên kết rút gọn theo bộ lọc và phân trang.
 *
 * @param filters - Bộ lọc và phân trang.
 * @returns Truy vấn danh sách link.
 */
export function useShortLinks(filters: ShortLinkFilters) {
  return useListQuery(shortLinkKeys.list(filters), (signal) =>
    shortLinkService.list(filters, signal),
  );
}
