"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { shortLinkKeys } from "../constants/query-keys";
import { shortLinkService } from "../services/short-link.service";

const INVALIDATE = [shortLinkKeys.all];

/**
 * Mutation xóa mềm nhiều liên kết rút gọn hàng loạt.
 *
 * @returns Mutation xóa nhiều link.
 */
export function useBulkDeleteShortLinks() {
  return useResourceMutation({
    mutationFn: (ids: string[]) => shortLinkService.bulkDelete(ids),
    invalidate: INVALIDATE,
    success: "bulkDeleted",
  });
}
