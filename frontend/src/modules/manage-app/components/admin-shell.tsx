"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import { AttachmentPicker } from "@/modules/attachment/components/attachment-picker";
import { ATTACHMENT_PERMISSIONS } from "@/modules/attachment/permissions/attachment-permission";
import { UserMenu } from "@/modules/auth/components/user-menu";
import { useLogout } from "@/modules/auth/hooks/use-logout";
import { usePermission } from "@/modules/auth/hooks/use-permission";
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
import { useMessage } from "@/shares/hooks/use-message";

import { MANAGE_APP_ROUTES } from "../constants/routes";
import { AdminBreadcrumb, type BreadcrumbEntry } from "./admin-breadcrumb";
import { AdminModulesProvider } from "./admin-modules-provider";
import { ModuleSidebar } from "./module-sidebar";
import { useAdminShell } from "./hooks/use-admin-shell";

const HEADER_CLASS =
  "bg-card sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6";

function AdminAttachmentPickerSlot(props: {
  onSelect: (file: { id: string; url: string }) => void;
  onClose: () => void;
}) {
  const canUpload = usePermission(ATTACHMENT_PERMISSIONS.create);
  return <AttachmentPicker canUpload={canUpload} {...props} />;
}

/**
 * Nhóm nút bên phải header: ngôn ngữ, giao diện; tài khoản chỉ có ở đây khi không có sidebar.
 *
 * @param props - Có hiện menu tài khoản không.
 * @returns Nhóm nút.
 */
function HeaderActions({ withAccount = false }: { withAccount?: boolean }) {
  const canReadLibrary = usePermission(ATTACHMENT_PERMISSIONS.read);
  return (
    <div className="flex items-center gap-2">
      <LanguageSwitcher />
      <ThemeSwitcher />
      {withAccount ? (
        <UserMenu
          renderAttachmentPicker={
            canReadLibrary
              ? (pickerProps) => <AdminAttachmentPickerSlot {...pickerProps} />
              : undefined
          }
        />
      ) : null}
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
  const message = useMessage();
  const pathname = usePathname();
  if (!group) return [{ label: t("admin"), href: MANAGE_APP_ROUTES.admin }];
  const crumbs: BreadcrumbEntry[] = [{ label: group.name, href: group.href }];
  const section = group.modules
    .flatMap((module) => module.items)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  if (section && pathname !== section.href) {
    crumbs.push({ label: message(section.labelKey), href: section.href });
  }
  return crumbs;
}

/** Khung màn chọn module: thanh trên (logo + nút), nội dung căn giữa, không sidebar. */
function LauncherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-canvas relative flex min-h-svh flex-col">
      {/* Vùng ánh sáng dịu phía trên và lưới chấm trang trí tinh tế */}
      <div
        className="from-primary/[0.04] dark:from-primary/[0.08] pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b via-transparent to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-border)_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-25"
        aria-hidden
      />
      <header className={HEADER_CLASS}>
        <Link href={MANAGE_APP_ROUTES.admin} className="flex h-10 items-center" aria-label="TOANNX">
          <Logo />
        </Link>
        <div className="flex-1" />
        <HeaderActions withAccount />
      </header>
      <main
        className="relative z-10 flex flex-1 items-start justify-center px-4 py-8 sm:px-6 sm:py-12 lg:items-center"
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
  const canReadLibrary = usePermission(ATTACHMENT_PERMISSIONS.read);
  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={onSidebarOpenChange}>
      <ModuleSidebar
        activeGroup={activeGroup}
        groups={groups}
        footer={
          <UserMenu
            variant="sidebar"
            renderAttachmentPicker={
              canReadLibrary
                ? (pickerProps) => <AdminAttachmentPickerSlot {...pickerProps} />
                : undefined
            }
          />
        }
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
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
      <div className="flex flex-1 items-start justify-center px-4 py-8 sm:px-6 sm:py-12 lg:items-center">
        <div className="w-full max-w-4xl space-y-7">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-6 w-44 rounded-full" />
            <Skeleton className="h-8 w-60 rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((key) => (
              <Skeleton key={key} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-6 w-full rounded-lg" />
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
