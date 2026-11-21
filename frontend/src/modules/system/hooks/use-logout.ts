"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/store/auth-store";

import { SYSTEM_ROUTES } from "../constants/routes";
import { authService } from "../services/auth.service";

/**
 * Đăng xuất (một hoặc mọi thiết bị): thu hồi phiên, xóa cache nhạy cảm, về trang đăng nhập.
 * Kích hoạt cờ isLoggingOut để ngăn các cảnh báo hết hạn phiên giả mạo khi client xóa cookie.
 * Hiển thị thông báo Sonner thành công duy nhất khi rời khu vực quản trị.
 *
 * @returns Mutation React Query; biến `all` = true để đăng xuất mọi thiết bị.
 */
export function useLogout() {
  const t = useTranslations("system.auth.session");
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (all: boolean = false) => {
      useAuthStore.getState().startLoggingOut();
      return all ? authService.logoutAll() : authService.logout();
    },
    onSettled: (_data, _error, variables) => {
      // Dù API lỗi (mạng), vẫn xóa dữ liệu phía client và rời khu vực quản trị.
      queryClient.clear();
      useAuthStore.getState().resetSession();
      toast.dismiss("session-expired");
      toast.success(variables ? t("logoutAllSuccess") : t("logoutSuccess"), {
        id: "logout-success",
      });
      router.replace(SYSTEM_ROUTES.login);
    },
  });
}
