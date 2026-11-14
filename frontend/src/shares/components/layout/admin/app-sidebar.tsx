"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { Logo, LogoMark } from "@/shares/components/layout/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/shares/components/ui/sidebar";
import { APP_ROUTES } from "@/shares/constants/routes";
import type { AdminNavItem } from "@/shares/types/navigation.types";

/**
 * Sidebar quản trị: desktop đầy đủ, tablet thu gọn icon, mobile dạng drawer.
 *
 * @param props - Danh sách mục đã lọc theo quyền/module.
 * @returns Sidebar.
 */
export function AppSidebar({ items }: { items: AdminNavItem[] }) {
  const t = useTranslations("common.nav");
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const isActive = (href: string) =>
    href === APP_ROUTES.admin
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href={APP_ROUTES.admin} className="flex h-10 items-center px-1" aria-label="TOANNX">
          <span className="group-data-[collapsible=icon]:hidden">
            <Logo />
          </span>
          <LogoMark className="hidden size-7 group-data-[collapsible=icon]:block" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={t(item.labelKey)}
                  >
                    <Link href={item.href} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{t(item.labelKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
