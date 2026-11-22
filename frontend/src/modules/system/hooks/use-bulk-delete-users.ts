"use client";

import { authKeys } from "@/modules/system/constants/query-keys";
import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { accountKeys } from "../constants/query-keys";
import { userService } from "../services/user.service";

const INVALIDATE = [accountKeys.all, authKeys.me()];

/**
 * Mutation xóa mềm nhiều người dùng hàng loạt.
 *
 * @returns Mutation xóa nhiều người dùng.
 */
export function useBulkDeleteUsers() {
  return useResourceMutation({
    mutationFn: (ids: string[]) => userService.bulkDelete(ids),
    invalidate: INVALIDATE,
    success: "bulkDeleted",
  });
}
