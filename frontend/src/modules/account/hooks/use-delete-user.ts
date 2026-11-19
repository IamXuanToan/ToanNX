"use client";

import { authKeys } from "@/modules/auth/constants/query-keys";
import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { accountKeys } from "../constants/query-keys";
import { userService } from "../services/user.service";

const INVALIDATE = [accountKeys.all, authKeys.me()];

/**
 * Mutation xóa mềm một người dùng.
 *
 * @returns Mutation xóa mềm người dùng.
 */
export function useDeleteUser() {
  return useResourceMutation({
    mutationFn: (id: string) => userService.delete(id),
    invalidate: INVALIDATE,
    success: "deleted",
  });
}
