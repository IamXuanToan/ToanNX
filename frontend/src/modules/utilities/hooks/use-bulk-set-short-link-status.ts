"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { shortLinkKeys } from "../constants/query-keys";
import { shortLinkService } from "../services/short-link.service";
import type { ShortLinkStatus } from "../types/short-link.types";

const INVALIDATE = [shortLinkKeys.all];

/**
 * Mutation bật hoặc tắt trạng thái của nhiều liên kết rút gọn hàng loạt.
 *
 * @returns Mutation cập nhật trạng thái link hàng loạt.
 */
export function useBulkSetShortLinkStatus() {
  return useResourceMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: ShortLinkStatus }) =>
      shortLinkService.bulkSetStatus(ids, status),
    invalidate: INVALIDATE,
    success: "bulkUpdated",
  });
}
