"use client";

import { useQuery } from "@tanstack/react-query";

import { pageKeys } from "../constants/query-keys";
import { pageService } from "../services/page.service";

/**
 * Lấy dữ liệu công khai của trang tùy chỉnh qua segment và slug (gọi API phía client).
 *
 * @param segment - Segment đường dẫn (ví dụ "p").
 * @param slug - Slug của trang.
 * @param enabled - Tải khi cần.
 * @returns Truy vấn React Query dữ liệu trang công khai.
 */
export function usePublicPage(segment: string, slug: string, enabled = true) {
  return useQuery({
    queryKey: pageKeys.public(segment, slug),
    queryFn: ({ signal }) => pageService.getPublic(segment, slug, signal),
    enabled: Boolean(segment && slug) && enabled,
    retry: false,
  });
}
