"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { pageKeys, pagePathKeys } from "../constants/query-keys";
import { pageService } from "../services/page.service";
import type { PageStatus } from "../types/page.types";

const INVALIDATE = [pageKeys.all, pagePathKeys.all];

/**
 * Mutation đổi trạng thái nhiều trang.
 *
 * @returns Mutation cập nhật trạng thái nhiều trang.
 */
export function useBulkSetPageStatus() {
  return useResourceMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: PageStatus }) =>
      pageService.bulkSetStatus(ids, status),
    invalidate: INVALIDATE,
    success: "bulkUpdated",
  });
}
