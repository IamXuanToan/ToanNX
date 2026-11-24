"use client";

import { useQuery } from "@tanstack/react-query";

import { shortLinkKeys } from "../constants/query-keys";
import { shortLinkService } from "../services/short-link.service";

/**
 * Lấy thông tin công khai của một liên kết rút gọn qua slug (gọi API phía client).
 *
 * @param slug - Slug của short link.
 * @param enabled - Tải khi cần.
 * @returns Truy vấn React Query thông tin link rút gọn công khai.
 */
export function usePublicShortLink(slug: string, enabled = true) {
  return useQuery({
    queryKey: shortLinkKeys.resolve(slug),
    queryFn: ({ signal }) => shortLinkService.resolve(slug, signal),
    enabled: Boolean(slug) && enabled,
    retry: false,
  });
}
