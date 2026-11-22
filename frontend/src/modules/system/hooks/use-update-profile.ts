"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { authKeys } from "../constants/query-keys";
import { currentUserService } from "../services/current-user.service";
import type { CurrentUser, UpdateProfilePayload } from "../types/auth.types";

/**
 * Hook cập nhật thông tin hồ sơ của chính người dùng hiện tại qua PATCH `/system/auth/me`.
 * Cập nhật tức thì React Query cache và hiển thị thông báo toast chuẩn.
 *
 * @returns Trạng thái mutation cập nhật hồ sơ cá nhân.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const t = useTranslations("system.auth.profile");

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => currentUserService.update(payload),
    onSuccess: (updated: CurrentUser) => {
      queryClient.setQueryData(authKeys.me(), updated);
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
      toast.success(t("successMessage"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errorMessage"));
    },
  });
}
