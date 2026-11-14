"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { usePathname } from "@/i18n/navigation";
import { UserMenu } from "@/modules/auth/components/user-menu/user-menu";
import { useLogout } from "@/modules/auth/hooks/use-logout";
import { ErrorState } from "@/shares/components/errors/error-state";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import {
  AdminBreadcrumb,
  type BreadcrumbEntry,
} from "@/shares/components/layout/admin/admin-breadcrumb";
import { AppSidebar } from "@/shares/components/layout/admin/app-sidebar";
import { LanguageSwitcher } from "@/shares/components/layout/language-switcher";
import { ThemeSwitcher } from "@/shares/components/layout/theme-switcher";
import { Button } from "@/shares/components/ui/button";
import { Separator } from "@/shares/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/shares/components/ui/sidebar";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { APP_ROUTES } from "@/shares/constants/routes";
import type { AdminNavItem } from "@/shares/types/navigation.types";

import { useAdminShell } from "./hooks/use-admin-shell";

function useBreadcrumb(items: AdminNavItem[]): BreadcrumbEntry[] {
  const t = useTranslations("common.nav");
  const pathname = usePathname();
  const crumbs: BreadcrumbEntry[] = [{ label: t("admin"), href: APP_ROUTES.admin }];
  const section = items.find(
    (item) => item.href !== APP_ROUTES.admin && pathname.startsWith(item.href),
  );
  if (section) {
    crumbs.push({ label: t(section.labelKey), href: section.href });
    if (pathname !== section.href) crumbs.push({ label: t("detail") });
  } else {
    crumbs.push({ label: t("dashboard") });
  }
  return crumbs;
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-svh" aria-busy="true">
      <div className="bg-sidebar hidden w-64 border-r p-4 md:block">
        <Skeleton className="h-8 w-32" />
        <div className="mt-6 space-y-2">
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-8 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    </div>
  );
}

/**
 * Khung quản trị: bảo vệ truy cập (is_staff), sidebar, header, breadcrumb.
 * Chỉ là lớp hiển thị; backend luôn kiểm tra quyền từng API.
 *
 * @param props - Nội dung trang.
 * @returns Khung quản trị.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const { status, refetch, navigation, sidebarOpen, setSidebarOpen } = useAdminShell();
  const breadcrumb = useBreadcrumb(navigation);
  const logout = useLogout();
  const t = useTranslations("auth.userMenu");

  if (status === "loading") return <ShellSkeleton />;
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
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar items={navigation} />
      <SidebarInset>
        <header className="bg-background/80 sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-3 backdrop-blur sm:px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <div className="min-w-0 flex-1">
            <AdminBreadcrumb items={breadcrumb} />
          </div>
          <LanguageSwitcher />
          <ThemeSwitcher />
          <UserMenu />
        </header>
        <div className="flex-1 p-4 sm:p-6" data-testid="admin-content">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
