"use client";

import { authKeys } from "@/modules/auth/constants/query-keys";
import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { accountKeys } from "../constants/query-keys";
import { userService } from "../services/user.service";
import type { UpdateUserInput } from "../types/user.types";

const INVALIDATE = [accountKeys.all, authKeys.me()];

/**
 * Mutation cập nhật thông tin người dùng.
 *
 * @param id - Id người dùng cần cập nhật.
 * @returns Mutation cập nhật người dùng.
 */
export function useUpdateUser(id: string) {
  return useResourceMutation({
    mutationFn: (input: UpdateUserInput) => userService.update(id, input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
