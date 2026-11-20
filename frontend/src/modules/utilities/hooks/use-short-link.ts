"use client";

import { useQuery } from "@tanstack/react-query";

import { shortLinkKeys } from "../constants/query-keys";
import { shortLinkService } from "../services/short-link.service";

/**
 * Lấy chi tiết một liên kết rút gọn.
 *
 * @param id - Id link.
 * @param enabled - Tải khi cần.
 * @returns Truy vấn React Query chi tiết link rút gọn.
 */
export function useShortLink(id: string, enabled = true) {
  return useQuery({
    queryKey: shortLinkKeys.detail(id),
    queryFn: ({ signal }) => shortLinkService.get(id, signal),
    enabled,
  });
}
