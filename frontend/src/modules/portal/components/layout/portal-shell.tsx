"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { SYSTEM_ROUTES } from "@/modules/system/constants/routes";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { Button } from "@/shares/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/shares/components/ui/sidebar";

import { PortalBottomNav } from "./portal-bottom-nav";
import { PortalHeader } from "./portal-header";
import { PortalSidebar } from "./portal-sidebar";

/**
 * Khung giao diện toàn diện cho Client Portal (Studio cá nhân):
 * Tự động kiểm tra phiên xác thực, tích hợp SidebarProvider chuẩn Admin với tính năng
 * thu gọn dải icon và drawer mobile, khu vực nội dung SidebarInset và thanh điều hướng dưới đáy.
 *
 * @param props - Nội dung trang con.
 * @returns Khung Portal.
 */
export function PortalShell({ children }: { children: ReactNode }) {
  const t = useTranslations("portal");
  const { data: currentUser, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="bg-canvas flex h-svh w-full items-center justify-center p-6">
        <Loader2 className="text-primary size-10 animate-spin" />
      </div>
    );
  }

  if (isError || !currentUser?.user) {
    return (
      <div className="bg-canvas flex h-svh w-full flex-col items-center justify-center p-6 text-center">
        <h2 className="text-foreground text-xl font-bold tracking-tight">
          {t("authRequired.title")}
        </h2>
        <p className="text-muted-foreground mt-2 max-w-md text-sm">
          {t("authRequired.description")}
        </p>
        <Button asChild className="mt-5 rounded-xl">
          <Link href={SYSTEM_ROUTES.login}>{t("authRequired.loginButton")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <PortalSidebar />
      <SidebarInset>
        <PortalHeader />
        <div
          className="w-full max-w-[1600px] flex-1 p-4 pb-20 sm:p-6 md:pb-8 lg:p-8"
          data-testid="portal-content"
        >
          {children}
        </div>
        <PortalBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
