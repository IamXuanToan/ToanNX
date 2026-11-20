"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { pageKeys, pagePathKeys } from "../constants/query-keys";
import { pageService } from "../services/page.service";

const INVALIDATE = [pageKeys.all, pagePathKeys.all];

/**
 * Mutation xóa nhiều trang.
 *
 * @returns Mutation xóa nhiều trang.
 */
export function useBulkDeletePages() {
  return useResourceMutation({
    mutationFn: (ids: string[]) => pageService.bulkDelete(ids),
    invalidate: INVALIDATE,
    success: "bulkDeleted",
  });
}
