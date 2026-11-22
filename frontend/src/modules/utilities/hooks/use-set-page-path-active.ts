"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { pageKeys, pagePathKeys } from "../constants/query-keys";
import { pagePathService } from "../services/page-path.service";

const INVALIDATE = [pagePathKeys.all, pageKeys.all];

/**
 * Mutation bật hoặc tắt trạng thái hoạt động của đường dẫn giữa.
 *
 * @returns Mutation cập nhật trạng thái hoạt động.
 */
export function useSetPagePathActive() {
  return useResourceMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      pagePathService.update(id, { isActive }),
    invalidate: INVALIDATE,
  });
}
