"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import { UserMenu } from "@/modules/auth/components/user-menu/user-menu";
import { useLogout } from "@/modules/auth/hooks/use-logout";
import { ErrorState } from "@/shares/components/errors/error-state";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { LanguageSwitcher } from "@/shares/components/layout/language-switcher";
import { Logo } from "@/shares/components/layout/logo";
import { ThemeSwitcher } from "@/shares/components/layout/theme-switcher";
import { Button } from "@/shares/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/shares/components/ui/sidebar";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shares/components/ui/tooltip";
import type { AdminGroup } from "@/shares/types/navigation.types";

import { MANAGE_APP_ROUTES } from "../../constants/routes";
import { AdminBreadcrumb, type BreadcrumbEntry } from "../admin-breadcrumb/admin-breadcrumb";
import { AdminModulesProvider } from "../admin-modules-provider/admin-modules-provider";
import { ModuleSidebar } from "../module-sidebar/module-sidebar";
import { useAdminShell } from "./hooks/use-admin-shell";

const HEADER_CLASS =
  "bg-card sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6";

/**
 * Nhóm nút bên phải header: ngôn ngữ, giao diện; tài khoản chỉ có ở đây khi không có sidebar.
 *
 * @param props - Có hiện menu tài khoản không.
 * @returns Nhóm nút.
 */
function HeaderActions({ withAccount = false }: { withAccount?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <LanguageSwitcher />
      <ThemeSwitcher />
      {withAccount ? <UserMenu /> : null}
    </div>
  );
}

/**
 * Breadcrumb trong nhóm: chỉ các cấp cha của trang đang đứng (tên trang nằm ở đầu trang).
 * Trang danh sách: `Nhóm`; trang chi tiết: `Nhóm › Mục`.
 *
 * @param group - Nhóm đang đứng.
 * @returns Các mục breadcrumb (mục cuối vẫn là link).
 */
function useGroupBreadcrumb(group?: AdminGroup): BreadcrumbEntry[] {
  const t = useTranslations("common.nav");
  const pathname = usePathname();
  if (!group) return [{ label: t("admin"), href: MANAGE_APP_ROUTES.admin }];
  const crumbs: BreadcrumbEntry[] = [{ label: group.name, href: group.href }];
  const section = group.modules
    .flatMap((module) => module.items)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  if (section && pathname !== section.href) {
    crumbs.push({ label: t(section.labelKey), href: section.href });
  }
  return crumbs;
}

/** Khung màn chọn module: thanh trên (logo + nút), nội dung căn giữa, không sidebar. */
function LauncherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-canvas flex min-h-svh flex-col">
      <header className={HEADER_CLASS}>
        <Link href={MANAGE_APP_ROUTES.admin} className="flex h-10 items-center" aria-label="TOANNX">
          <Logo />
        </Link>
        <div className="flex-1" />
        <HeaderActions withAccount />
      </header>
      <main
        className="flex flex-1 items-start justify-center px-4 py-10 sm:px-6 sm:py-16 lg:items-center"
        data-testid="admin-content"
      >
        {children}
      </main>
    </div>
  );
}

/** Khung trong nhóm module: sidebar trái (menu chia theo module), nội dung phải. */
function WorkspaceLayout({
  activeGroup,
  groups,
  sidebarOpen,
  onSidebarOpenChange,
  children,
}: {
  activeGroup?: AdminGroup;
  groups: AdminGroup[];
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const breadcrumb = useGroupBreadcrumb(activeGroup);
  const t = useTranslations("manageApp.shell");
  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={onSidebarOpenChange}>
      <ModuleSidebar
        activeGroup={activeGroup}
        groups={groups}
        footer={<UserMenu variant="sidebar" />}
      />
      <SidebarInset>
        <header className={HEADER_CLASS}>
          <SidebarTrigger className="-ml-2 size-10 rounded-xl" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" className="text-muted-foreground">
                <Link
                  href={MANAGE_APP_ROUTES.admin}
                  aria-label={t("backToModules")}
                  data-testid="back-to-modules"
                >
                  <ArrowLeft />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t("backToModules")}</TooltipContent>
          </Tooltip>
          <div className="min-w-0 flex-1">
            <AdminBreadcrumb items={breadcrumb} />
          </div>
          <HeaderActions />
        </header>
        <div className="w-full max-w-[1600px] flex-1 p-4 sm:p-6 lg:p-8" data-testid="admin-content">
          {activeGroup ? children : <ForbiddenView />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

/** Khung chờ của màn chọn module: lưới thẻ giữ chỗ. */
function LauncherSkeleton() {
  return (
    <div className="bg-canvas flex min-h-svh flex-col" aria-busy="true">
      <div className="bg-card flex h-16 items-center border-b px-4 sm:px-6">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-4xl space-y-8">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Khung chờ của không gian module: sidebar + nội dung giữ chỗ. */
function WorkspaceSkeleton() {
  return (
    <div className="bg-canvas flex min-h-svh" aria-busy="true">
      <div className="bg-sidebar hidden w-64 md:block">
        <div className="flex h-16 items-center border-b px-3">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-1 p-3">
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex-1">
        <div className="bg-card flex h-16 items-center border-b px-6">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-6 h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

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
  const t = useTranslations("auth.userMenu");

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
