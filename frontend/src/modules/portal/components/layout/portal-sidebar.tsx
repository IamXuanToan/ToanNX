"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { UserMenu } from "@/modules/system/components/current-user/user-menu";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { hasPermission } from "@/modules/system/services/current-user.service";
import { LogoMark } from "@/shares/components/layout/logo-mark";
import { Badge } from "@/shares/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/shares/components/ui/sidebar";

import { isPortalNavItemActive, PORTAL_NAV_SECTIONS } from "../../constants/navigation";
import { PORTAL_ROUTES } from "../../constants/routes";
import { PortalSidebarSection } from "./portal-sidebar-section";

/**
 * Thanh điều hướng sidebar của Client Portal:
 * đọc khai báo gom cụm từ `PORTAL_NAV_SECTIONS`, lọc theo quyền người dùng hiện tại
 * và giao việc thu gọn từng cụm cho `PortalSidebarSection`.
 *
 * @returns Component Sidebar Portal.
 */
export function PortalSidebar() {
  const t = useTranslations("portal.navigation");
  const tActions = useTranslations("common.actions");
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { data: currentUser } = useCurrentUser();

  const sections = PORTAL_NAV_SECTIONS.map((section) => ({
    ...section,
    label: t(section.labelKey),
    items: section.items
      .filter((item) => !item.permission || hasPermission(currentUser, item.permission))
      .map((item) => ({
        key: item.key,
        title: t(item.labelKey),
        href: item.href,
        icon: item.icon,
        active: isPortalNavItemActive(pathname, item),
      })),
  })).filter((section) => section.items.length > 0);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 shrink-0 justify-center border-b px-3 py-0">
        <Link
          href={PORTAL_ROUTES.dashboard}
          onClick={() => setOpenMobile(false)}
          className="text-foreground flex items-center gap-2.5 overflow-hidden font-bold tracking-tight group-data-[collapsible=icon]:justify-center"
        >
          <LogoMark className="size-7 shrink-0" />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-1.5 group-data-[collapsible=icon]:hidden">
            <span className="truncate text-base font-extrabold tracking-tight">ToanNX</span>
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20 shrink-0 text-[11px] font-semibold"
            >
              Studio
            </Badge>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-3 group-data-[collapsible=icon]:[scrollbar-width:none] group-data-[collapsible=icon]:overflow-y-auto">
        {sections.map((section, index) => (
          <PortalSidebarSection
            key={section.key}
            sectionKey={section.key}
            label={section.label}
            hideHeader={section.hideHeader}
            index={index}
            items={section.items}
            onNavigate={() => setOpenMobile(false)}
          />
        ))}
      </SidebarContent>

      <SidebarFooter className="px-3 pt-2 pb-3">
        <UserMenu variant="sidebar" />
      </SidebarFooter>
      <SidebarRail toggleLabel={tActions("toggleSidebar")} />
    </Sidebar>
  );
}
