"use client";

import { useTranslations } from "next-intl";

import { NotificationBell } from "@/modules/system/components/notification/notification-bell";
import { LanguageSwitcher } from "@/shares/components/layout/language-switcher";
import { ThemeSwitcher } from "@/shares/components/layout/theme-switcher";
import { SidebarTrigger } from "@/shares/components/ui/sidebar";

/**
 * Thanh header trên cùng của Client Portal:
 * Chuẩn hóa theo thiết kế Admin, có SidebarTrigger để ẩn/hiện/thu gọn sidebar,
 * các hành động nhanh (Thông báo, Ngôn ngữ, Giao diện). Đã loại bỏ nút Tạo nhanh.
 *
 * @returns Header Portal.
 */
export function PortalHeader() {
  const t = useTranslations("portal");

  return (
    <header className="border-border bg-card sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-2 size-10 rounded-xl" />
        <h2 className="text-foreground text-sm font-semibold tracking-tight">
          {t("dashboard.title")}
        </h2>
      </div>

      {/* Actions bên phải */}
      <div className="flex items-center gap-2.5">
        <NotificationBell />
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
    </header>
  );
}
