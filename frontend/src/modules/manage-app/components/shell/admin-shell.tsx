"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { useLogout } from "@/modules/system/hooks/use-logout";
import { ErrorState } from "@/shares/components/errors/error-state";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { AdminModulesProvider } from "./admin-modules-provider";
import { useAdminShell } from "./hooks/use-admin-shell";
import { LauncherLayout } from "../launcher/launcher-layout";
import { WorkspaceLayout } from "./workspace-layout";
import { LauncherSkeleton } from "../launcher/launcher-skeleton";
import { WorkspaceSkeleton } from "./workspace-skeleton";

/**
 * Khung quản trị: bảo vệ truy cập (is_staff), màn chọn nhóm module ở `/admin`,
 * không gian nhóm (sidebar chia theo module của nhóm) ở các trang còn lại.
 * Chỉ là lớp hiển thị; backend luôn kiểm tra quyền từng API.
 *
 * @param props - Nội dung trang.
 * @returns Khung quản trị.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const { status, refetch, isLauncher, groups, activeGroup, sidebarOpen, setSidebarOpen } =
    useAdminShell();
  const logout = useLogout();
  const t = useTranslations("system.auth.userMenu");

  if (status === "loading") return isLauncher ? <LauncherSkeleton /> : <WorkspaceSkeleton />;
  if (status === "error") {
    return (
      <div className="mx-auto max-w-md p-6 pt-24">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }
  if (status === "forbidden") {
    return (
      <ForbiddenView
        action={
          <Button variant="outline" onClick={() => logout.mutate(false)}>
            {t("logout")}
          </Button>
        }
      />
    );
  }

  return (
    <AdminModulesProvider groups={groups}>
      {isLauncher ? (
        <LauncherLayout>{children}</LauncherLayout>
      ) : (
        <WorkspaceLayout
          activeGroup={activeGroup}
          groups={groups}
          sidebarOpen={sidebarOpen}
          onSidebarOpenChange={setSidebarOpen}
        >
          {children}
        </WorkspaceLayout>
      )}
    </AdminModulesProvider>
  );
}
