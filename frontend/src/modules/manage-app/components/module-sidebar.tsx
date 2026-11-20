"use client";

import { cn } from "cn";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/shares/components/ui/sidebar";
import type { AdminGroup, AdminModule } from "@/shares/types/navigation.types";
import { useMessage } from "@/shares/hooks/use-message";

import { ModuleSwitcher } from "./module-switcher";
import { useSidebarModuleGroup } from "./hooks/use-sidebar-module-group";

/**
 * Link sidebar: cao 40px, icon đứng yên ở cả hai trạng thái (thu gọn chỉ bóp bề rộng),
 * mục đang chọn tô màu nhấn nhạt.
 */
const NAV_LINK_CLASS =
  "text-foreground/70 hover:bg-item-hover hover:text-foreground data-active:bg-primary-light data-active:text-primary data-active:hover:bg-primary-light data-active:hover:text-primary h-10 gap-2.5 rounded-xl px-3 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-3!";

/**
 * Một nhóm module trong sidebar: nhãn IN HOA bấm để thu gọn, mục con trượt mở/đóng.
 * Lúc sidebar thu về dải icon: nhãn mờ tại chỗ, thay bằng gạch ngắn; icon mục con vẫn hiện.
 */
function SidebarModuleGroup({
  module,
  isActive,
  onNavigate,
}: {
  module: AdminModule;
  isActive: (href: string) => boolean;
  onNavigate: () => void;
}) {
  const message = useMessage();
  const { expanded, contentId, toggleOpen } = useSidebarModuleGroup({ module, isActive });

  return (
    <div className="mt-4 first:mt-0" data-testid={`sidebar-module-${module.code}`}>
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={toggleOpen}
          className="text-muted-foreground hover:bg-item-hover hover:text-foreground flex h-10 w-full items-center justify-between rounded-xl px-3 text-xs font-medium tracking-wide whitespace-nowrap uppercase outline-hidden transition-[background-color,color,opacity] duration-150 group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0"
        >
          <span className="min-w-0 truncate">{module.name}</span>
          <ChevronDown
            aria-hidden
            className={cn(
              "ml-auto size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none",
              !expanded && "-rotate-90",
            )}
          />
        </Button>
        <span
          aria-hidden
          className="bg-border pointer-events-none absolute top-1/2 left-6 h-px w-4 opacity-0 transition-opacity duration-150 group-data-[collapsible=icon]:opacity-100"
        />
      </div>
      <div
        id={contentId}
        inert={!expanded}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <SidebarMenu className="min-h-0 gap-1 overflow-hidden">
          {module.items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                tooltip={message(item.labelKey)}
                className={NAV_LINK_CLASS}
              >
                <Link href={item.href} onClick={onNavigate}>
                  <item.icon aria-hidden />
                  <span>{message(item.labelKey)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>
    </div>
  );
}

/**
 * Sidebar của một nhóm module: đầu là bộ chuyển nhóm, thân chia mục theo từng module của nhóm
 * (nhãn mục = tên module), chân là tài khoản. Desktop mở đầy đủ, thu gọn về dải icon 64px,
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
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

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
