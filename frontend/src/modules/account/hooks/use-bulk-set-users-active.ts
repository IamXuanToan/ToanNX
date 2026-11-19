"use client";

import { authKeys } from "@/modules/auth/constants/query-keys";
import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { accountKeys } from "../constants/query-keys";
import { userService } from "../services/user.service";

const INVALIDATE = [accountKeys.all, authKeys.me()];

/**
 * Mutation khóa hoặc mở khóa nhiều người dùng hàng loạt.
 *
 * @returns Mutation cập nhật trạng thái hoạt động hàng loạt.
 */
export function useBulkSetUsersActive() {
  return useResourceMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      userService.bulkSetActive(ids, isActive),
    invalidate: INVALIDATE,
    success: "bulkUpdated",
  });
}
