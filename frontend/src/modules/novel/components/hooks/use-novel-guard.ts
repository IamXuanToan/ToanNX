"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { SYSTEM_ROUTES } from "@/modules/system/constants/routes";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";

import { NOVEL_ROUTES } from "../../constants/routes";

/**
 * Hook kiểm tra phân quyền truy cập module Novel:
 * - Nếu chưa đăng nhập: chuyển hướng sang trang đăng nhập kèm query redirect.
 * - Nếu đã đăng nhập nhưng tài khoản không có quyền đọc (`!isNovel && !isSuperuser`): hiển thị toast cảnh báo và chuyển về trang chủ.
 *
 * @returns Trạng thái `isLoading` và `canAccess`.
 */
export function useNovelGuard() {
  const t = useTranslations("novel.auth");
  const router = useRouter();
  const { data: current, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;

    if (!current?.user) {
      // Chưa đăng nhập -> chuyển sang đăng nhập kèm query redirect
      const currentUrl =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : NOVEL_ROUTES.catalog;
      router.replace({
        pathname: SYSTEM_ROUTES.login,
        query: { redirect: currentUrl },
      });
      return;
    }

    const canAccess = current.user.isActive && (current.user.isNovel || current.user.isSuperuser);

    if (!canAccess) {
      toast.error(t("accessDenied"));
      router.replace("/");
    }
  }, [current, isLoading, router, t]);

  const canAccess = Boolean(
    current?.user?.isActive && (current.user.isNovel || current.user.isSuperuser),
  );

  return {
    isLoading,
    canAccess,
  };
}
