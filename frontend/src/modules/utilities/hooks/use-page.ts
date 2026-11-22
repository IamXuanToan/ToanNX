"use client";

import { useQuery } from "@tanstack/react-query";

import { pageKeys } from "../constants/query-keys";
import { pageService } from "../services/page.service";

/**
 * Lấy chi tiết trang cho editor.
 *
 * @param id - Id trang.
 * @returns Truy vấn React Query chi tiết trang.
 */
export function usePage(id: string) {
  return useQuery({
    queryKey: pageKeys.detail(id),
    queryFn: ({ signal }) => pageService.get(id, signal),
  });
}
