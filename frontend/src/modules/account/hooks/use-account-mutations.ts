"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { accountKeys, authKeys } from "@/shares/constants/query-keys";

import { accountService } from "../services/account.service";
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
    mutationFn: (input: CreateUserInput) => accountService.createUser(input),
    onSuccess,
  });
}

/** @param id - Id người dùng. @returns Mutation cập nhật người dùng (lỗi do form tự hiển thị). */
export function useUpdateUser(id: string) {
  const onSuccess = useAccountMutationSuccess();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => accountService.updateUser(id, input),
    onSuccess,
  });
}
