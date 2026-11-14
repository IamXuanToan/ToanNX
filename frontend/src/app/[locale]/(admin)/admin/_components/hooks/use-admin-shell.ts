"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/modules/auth/hooks/use-current-user";
import { canAccessAdmin, hasPermission } from "@/modules/auth/services/auth.service";
import { accountNavigation } from "@/modules/account/navigation";
import { dashboardNavigation } from "@/modules/dashboard/navigation";
import { iamNavigation } from "@/modules/iam/navigation";
import { systemNavigation } from "@/modules/system/navigation";
import { APP_ROUTES } from "@/shares/constants/routes";
import { useMediaQuery } from "@/shares/hooks/use-media-query";
import { isApiError } from "@/shares/lib/api/api-error";
import { useAuthStore } from "@/store/auth-store";

/** Điều hướng admin gộp từ các module. Module mới chỉ cần thêm mảng của nó vào đây. */
const ADMIN_NAVIGATION = [
  ...dashboardNavigation,
  ...accountNavigation,
  ...iamNavigation,
  ...systemNavigation,
];
const TABLET_QUERY = "(min-width: 768px) and (max-width: 1279px)";

/**
 * Logic khung quản trị: tải người dùng, bảo vệ truy cập, xử lý phiên hết hạn, sidebar theo thiết bị.
 *
 * @returns Trạng thái hiển thị của khung quản trị.
 */
export function useAdminShell() {
  const t = useTranslations("auth.session");
  const queryClient = useQueryClient();
  const router = useRouter();
  const current = useCurrentUser();
  const sessionExpired = useAuthStore((state) => state.sessionExpired);
  const resetSession = useAuthStore((state) => state.resetSession);
  const isTablet = useMediaQuery(TABLET_QUERY);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [prevTablet, setPrevTablet] = useState(isTablet);

  // Tablet: thu gọn sidebar thành icon; desktop: mở đầy đủ.
  if (prevTablet !== isTablet) {
    setPrevTablet(isTablet);
    setSidebarOpen(!isTablet);
  }

  const unauthenticated = isApiError(current.error) && current.error.status === 401;

  useEffect(() => {
    if (!sessionExpired && !unauthenticated) return;
    if (sessionExpired) toast.warning(t("expired"));
    queryClient.clear();
    resetSession();
    // Refresh thất bại thì backend đã xóa cookie phiên → proxy không đẩy ngược về admin.
    router.replace({
      pathname: APP_ROUTES.login,
      query: { next: window.location.pathname + window.location.search },
    });
  }, [sessionExpired, unauthenticated, queryClient, resetSession, router, t]);

  const navigation = useMemo(() => {
    const enabledModules = new Set(current.data?.modules.map((module) => module.code));
    return ADMIN_NAVIGATION.filter(
      (item) =>
        enabledModules.has(item.module) &&
        (!item.permission || hasPermission(current.data, item.permission)),
    );
  }, [current.data]);

  return {
    status:
      current.isPending || unauthenticated
        ? "loading"
        : current.isError
          ? "error"
          : canAccessAdmin(current.data)
            ? "ready"
            : "forbidden",
    refetch: current.refetch,
    navigation,
    sidebarOpen,
    setSidebarOpen,
  } as const;
}
