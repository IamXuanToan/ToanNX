"use client";

import { authKeys } from "@/modules/auth/constants/query-keys";
import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { accountKeys } from "../constants/query-keys";
import { userService } from "../services/user.service";
import type { CreateUserInput } from "../types/user.types";

const INVALIDATE = [accountKeys.all, authKeys.me()];

/**
 * Mutation tạo người dùng mới.
 *
 * @returns Mutation tạo người dùng.
 */
export function useCreateUser() {
  return useResourceMutation({
    mutationFn: (input: CreateUserInput) => userService.create(input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
