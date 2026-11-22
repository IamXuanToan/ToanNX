"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { SYSTEM_ROUTES } from "@/modules/system/constants/routes";
import { canAccessAdmin, hasPermission } from "@/modules/system/services/current-user.service";
import { useMediaQuery } from "@/shares/hooks/use-media-query";
import { useMessage } from "@/shares/hooks/use-message";
import { isApiError } from "@/shares/lib/api/api-error";
import type { AdminGroup, AdminModule } from "@/shares/types/navigation.types";
import { useAuthStore } from "@/store/auth-store";

import {
  ADMIN_GROUPS,
  ADMIN_MODULE_NAVIGATION,
  findModuleCodeByPath,
} from "../../../constants/admin-navigation";
import { MANAGE_APP_ROUTES } from "../../../constants/routes";

const TABLET_QUERY = "(min-width: 768px) and (max-width: 1279px)";

/**
 * Logic khung quản trị: tải người dùng, bảo vệ truy cập, xử lý phiên hết hạn,
 * nhóm module được vào (khai tĩnh ở FE, lọc theo quyền), nhóm đang đứng và sidebar theo thiết bị.
 *
 * @returns Trạng thái hiển thị của khung quản trị.
 */
export function useAdminShell() {
  const t = useTranslations("system.auth.session");
  const tProfile = useTranslations("system.auth.profile");
  const message = useMessage();
  const tGroups = useTranslations("common.adminGroups");
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const current = useCurrentUser();
  const sessionExpired = useAuthStore((state) => state.sessionExpired);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);
  const resetSession = useAuthStore((state) => state.resetSession);
  const isTablet = useMediaQuery(TABLET_QUERY);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [prevTablet, setPrevTablet] = useState(isTablet);
  const verificationToastShownRef = useRef(false);

  // Tablet: thu gọn sidebar thành icon; desktop: mở đầy đủ.
  if (prevTablet !== isTablet) {
    setPrevTablet(isTablet);
    setSidebarOpen(!isTablet);
  }

  const unauthenticated = isApiError(current.error) && current.error.status === 401;

  useEffect(() => {
    if (!current.data?.user || current.data.user.isVerified || verificationToastShownRef.current) {
      return;
    }
    verificationToastShownRef.current = true;
    toast.warning(tProfile("emailUnverified"), {
      description: tProfile("unverifiedReminder"),
      duration: 8000,
    });
  }, [current.data?.user, tProfile]);

  useEffect(() => {
    // Đang trong tiến trình đăng xuất chủ động thì không hiển thị cảnh báo hết hạn phiên.
    if (isLoggingOut) return;
    if (!sessionExpired && !unauthenticated) return;
    if (sessionExpired) {
      toast.warning(t("expired"), { id: "session-expired" });
    }
    queryClient.clear();
    resetSession();
    // Refresh thất bại thì backend đã xóa cookie phiên → proxy không đẩy ngược về admin.
    router.replace({
      pathname: SYSTEM_ROUTES.login,
      query: { next: window.location.pathname + window.location.search },
    });
  }, [sessionExpired, unauthenticated, isLoggingOut, queryClient, resetSession, router, t]);

  const groups = useMemo<AdminGroup[]>(() => {
    const modulesByGroup = new Map<string, AdminModule[]>();
    for (const navigation of ADMIN_MODULE_NAVIGATION) {
      const items = navigation.items.filter(
        (item) => !item.permission || hasPermission(current.data, item.permission),
      );
      if (items.length === 0) continue;
      const entry: AdminModule = {
        code: navigation.module,
        name: message(navigation.nameKey),
        description: message(navigation.descriptionKey),
        icon: navigation.icon,
        items,
        href: items[0].href,
      };
      modulesByGroup.set(navigation.group, [
        ...(modulesByGroup.get(navigation.group) ?? []),
        entry,
      ]);
    }
    return ADMIN_GROUPS.flatMap(({ code, icon }) => {
      const modules = modulesByGroup.get(code);
      if (!modules?.length) return [];
      return [
        {
          code,
          name: tGroups(`${code}.name`),
          description: tGroups(`${code}.description`),
          icon,
          modules,
          href: modules[0].href,
        },
      ];
    });
  }, [current.data, message, tGroups]);

  const activeModuleCode = findModuleCodeByPath(pathname);
  const activeGroup = groups.find((group) =>
    group.modules.some((module) => module.code === activeModuleCode),
  );

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
    /** Đang ở màn chọn module (`/admin`). */
    isLauncher: pathname === MANAGE_APP_ROUTES.admin,
    groups,
    /** Nhóm đang đứng; undefined khi URL thuộc module người dùng không vào được. */
    activeGroup,
    sidebarOpen,
    setSidebarOpen,
  } as const;
}
