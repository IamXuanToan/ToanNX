"use client";

import type { ReactNode } from "react";

import { usePathname } from "@/i18n/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/shares/components/ui/sidebar";
import type { AdminGroup } from "@/shares/types/navigation.types";

import { findActiveNavHref } from "../constants/admin-navigation";
import { ModuleSwitcher } from "./module-switcher";
import { SidebarModuleGroup } from "./sidebar-module-group";

/**
 * Sidebar của một nhóm module: đầu là bộ chuyển nhóm, thân chia theo từng module của nhóm
 * (nhãn = tên module), trong module chia cụm theo `AdminNavItem.section`, chân là tài khoản. Desktop mở đầy đủ, thu gọn về dải icon 64px,
 * mobile dạng drawer.
 *
 * @param props - Nhóm đang đứng, các nhóm người dùng vào được và khối tài khoản ở chân.
 * @returns Sidebar.
 */
export function ModuleSidebar({
  activeGroup,
  groups,
  footer,
}: {
  activeGroup?: AdminGroup;
  groups: AdminGroup[];
  footer?: ReactNode;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const activeHref = findActiveNavHref(
    pathname,
    (activeGroup?.modules ?? []).flatMap((module) => module.items.map((item) => String(item.href))),
  );
  const isActive = (href: string) => href === activeHref;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 shrink-0 justify-center border-b px-3 py-0">
        <ModuleSwitcher activeGroup={activeGroup} groups={groups} />
      </SidebarHeader>
      <SidebarContent className="px-3 py-3 group-data-[collapsible=icon]:[scrollbar-width:none] group-data-[collapsible=icon]:overflow-y-auto">
        {activeGroup?.modules.map((module) => (
          <SidebarModuleGroup
            key={module.code}
            module={module}
            showHeader={(activeGroup?.modules.length ?? 0) > 1}
            isActive={isActive}
            onNavigate={() => setOpenMobile(false)}
          />
        ))}
      </SidebarContent>
      {footer ? <SidebarFooter className="px-3 pt-2 pb-3">{footer}</SidebarFooter> : null}
      <SidebarRail />
    </Sidebar>
  );
}
