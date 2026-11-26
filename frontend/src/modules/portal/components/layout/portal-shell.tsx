"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { AssistantFloatingWidget } from "@/modules/workspace/components/assistant/assistant-floating-widget";
import { ErrorState } from "@/shares/components/errors/error-state";
import { SidebarInset, SidebarProvider } from "@/shares/components/ui/sidebar";

import { usePortalShell } from "./hooks/use-portal-shell";
import { PortalBottomNav } from "./portal-bottom-nav";
import { PortalHeader } from "./portal-header";
import { PortalSidebar } from "./portal-sidebar";

/**
 * Khung giao diện toàn diện cho Client Portal (Studio cá nhân):
 * Tự động kiểm tra phiên xác thực, chuyển thẳng về trang đăng nhập nếu chưa đăng nhập hoặc hết phiên,
 * tích hợp SidebarProvider chuẩn Admin với tính năng thu gọn dải icon và drawer mobile.
 *
 * @param props - Nội dung trang con.
 * @returns Khung Portal.
 */
export function PortalShell({ children }: { children: ReactNode }) {
  const { status, refetch } = usePortalShell();

  if (status === "loading") {
    return (
      <div className="bg-canvas flex h-svh w-full items-center justify-center p-6">
        <Loader2 className="text-primary size-10 animate-spin" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md p-6 pt-24">
        <ErrorState onRetry={() => refetch()} />
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
        <AssistantFloatingWidget />
      </SidebarInset>
    </SidebarProvider>
  );
}
