"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { authKeys } from "@/modules/auth/constants/query-keys";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { accountKeys } from "../constants/query-keys";
import { userService } from "../services/user.service";
import type { CreateUserInput, UpdateUserInput } from "../types/account.types";

/**
 * Callback dùng chung: toast thành công, làm mới cache Account và hồ sơ người dùng hiện tại
 * (sửa chính mình làm đổi tên/ảnh trên header).
 *
 * @returns Hàm onSuccess cho mutation.
 */
function useAccountMutationSuccess() {
  const queryClient = useQueryClient();
  const t = useTranslations("account.feedback");
  return async () => {
    toast.success(t("saved"));
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: accountKeys.all }),
      queryClient.invalidateQueries({ queryKey: authKeys.me() }),
    ]);
  };
}

/** @returns Mutation tạo người dùng (lỗi do form tự hiển thị). */
export function useCreateUser() {
  const onSuccess = useAccountMutationSuccess();
  return useMutation({
    mutationFn: (input: CreateUserInput) => userService.create(input),
    onSuccess,
  });
}

/** @param id - Id người dùng. @returns Mutation cập nhật người dùng (lỗi do form tự hiển thị). */
export function useUpdateUser(id: string) {
  const onSuccess = useAccountMutationSuccess();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => userService.update(id, input),
    onSuccess,
  });
}

/**
 * Callback dùng chung của xoá / thao tác hàng loạt: toast theo số bản ghi, làm mới danh sách,
 * lỗi thì toast thông báo đã dịch (cả lô không đổi vì backend chạy trong một transaction).
 *
 * @returns Handler onSuccess/onError.
 */
function useAccountBulkHandlers() {
  const queryClient = useQueryClient();
  const t = useTranslations("common.feedback");
  const errorMessage = useApiErrorMessage();
  return {
    onSuccess: async (count: number | void) => {
      toast.success(typeof count === "number" ? t("bulkUpdated", { count }) : t("deleted"));
      await queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  };
}

/** @returns Mutation xoá mềm một người dùng. */
export function useDeleteUser() {
  const handlers = useAccountBulkHandlers();
  return useMutation({ mutationFn: (id: string) => userService.remove(id), ...handlers });
}

/** @returns Mutation khoá/mở nhiều người dùng. */
export function useBulkSetUsersActive() {
  const handlers = useAccountBulkHandlers();
  return useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      userService.bulkSetActive(ids, isActive),
    ...handlers,
  });
}

/** @returns Mutation xoá mềm nhiều người dùng. */
export function useBulkDeleteUsers() {
  const queryClient = useQueryClient();
  const t = useTranslations("common.feedback");
  const errorMessage = useApiErrorMessage();
  return useMutation({
    mutationFn: (ids: string[]) => userService.bulkRemove(ids),
    onSuccess: async (count) => {
      toast.success(t("bulkDeleted", { count }));
      await queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });
}
