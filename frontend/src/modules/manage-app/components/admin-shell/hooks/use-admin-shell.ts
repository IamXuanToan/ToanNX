"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/modules/auth/hooks/use-current-user";
import { AUTH_ROUTES } from "@/modules/auth/constants/routes";
import { canAccessAdmin, hasPermission } from "@/modules/auth/services/current-user.service";
import { useMediaQuery } from "@/shares/hooks/use-media-query";
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
  const t = useTranslations("auth.session");
  const tModules = useTranslations("common.adminModules");
  const tGroups = useTranslations("common.adminGroups");
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
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
      pathname: AUTH_ROUTES.login,
      query: { next: window.location.pathname + window.location.search },
    });
  }, [sessionExpired, unauthenticated, queryClient, resetSession, router, t]);

  const groups = useMemo<AdminGroup[]>(() => {
    const modulesByGroup = new Map<string, AdminModule[]>();
    for (const navigation of ADMIN_MODULE_NAVIGATION) {
      const items = navigation.items.filter(
        (item) => !item.permission || hasPermission(current.data, item.permission),
      );
      if (items.length === 0) continue;
      const entry: AdminModule = {
        code: navigation.module,
        name: tModules(`${navigation.module}.name`),
        description: tModules(`${navigation.module}.description`),
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
  }, [current.data, tModules, tGroups]);

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
