"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useRouter } from "@/i18n/navigation";
import { APP_ROUTES } from "@/shares/constants/routes";

import { authService } from "../services/auth.service";

/**
 * Đăng xuất (một hoặc mọi thiết bị): thu hồi phiên, xóa cache nhạy cảm, về trang đăng nhập.
 *
 * @returns Mutation React Query; biến `all` = true để đăng xuất mọi thiết bị.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (all: boolean = false) => (all ? authService.logoutAll() : authService.logout()),
    onSettled: () => {
      // Dù API lỗi (mạng), vẫn xóa dữ liệu phía client và rời khu vực quản trị.
      queryClient.clear();
      router.replace(APP_ROUTES.login);
    },
  });
}
