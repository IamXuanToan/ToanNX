"use client";

import { authKeys } from "@/modules/auth/constants/query-keys";
import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { accountKeys } from "../constants/query-keys";
import { userService } from "../services/user.service";
import type { CreateUserInput, UpdateUserInput } from "../types/account.types";

/** Sửa người dùng có thể đổi tên/ảnh của chính mình trên header nên làm mới cả `authKeys.me()`. */
const INVALIDATE = [accountKeys.all, authKeys.me()];

/** @returns Mutation tạo người dùng (lỗi do form tự hiển thị). */
export function useCreateUser() {
  return useResourceMutation({
    mutationFn: (input: CreateUserInput) => userService.create(input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}

/** @param id - Id người dùng. @returns Mutation cập nhật người dùng (lỗi do form tự hiển thị). */
export function useUpdateUser(id: string) {
  return useResourceMutation({
    mutationFn: (input: UpdateUserInput) => userService.update(id, input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}

/** @returns Mutation xoá mềm một người dùng. */
export function useDeleteUser() {
  return useResourceMutation({
    mutationFn: (id: string) => userService.remove(id),
    invalidate: INVALIDATE,
    success: "deleted",
  });
}

/** @returns Mutation khoá/mở nhiều người dùng (cả lô hoặc không gì cả). */
export function useBulkSetUsersActive() {
  return useResourceMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      userService.bulkSetActive(ids, isActive),
    invalidate: INVALIDATE,
    success: "bulkUpdated",
  });
}

/** @returns Mutation xoá mềm nhiều người dùng. */
export function useBulkDeleteUsers() {
  return useResourceMutation({
    mutationFn: (ids: string[]) => userService.bulkRemove(ids),
    invalidate: INVALIDATE,
    success: "bulkDeleted",
  });
}
