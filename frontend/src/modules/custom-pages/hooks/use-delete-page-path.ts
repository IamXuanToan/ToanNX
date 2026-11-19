"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { pageKeys, pagePathKeys } from "../constants/query-keys";
import { pagePathService } from "../services/page-path.service";

const INVALIDATE = [pagePathKeys.all, pageKeys.all];

/**
 * Mutation xóa đường dẫn giữa.
 *
 * @returns Mutation xóa đường dẫn giữa.
 */
export function useDeletePagePath() {
  return useResourceMutation({
    mutationFn: (id: string) => pagePathService.delete(id),
    invalidate: INVALIDATE,
    success: "deleted",
  });
}
