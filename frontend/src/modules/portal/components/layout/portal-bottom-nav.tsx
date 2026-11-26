"use client";

import {
  BellRing,
  Bot,
  CreditCard,
  FileText,
  Laptop,
  LayoutDashboard,
  Link2,
  Menu,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { hasPermission } from "@/modules/system/services/current-user.service";
import { PAGE_PERMISSIONS } from "@/modules/utilities/permissions/page-permission";
import { SHORT_LINK_PERMISSIONS } from "@/modules/utilities/permissions/short-link-permission";
import { WORKSPACE_PATHNAMES, WORKSPACE_ROUTES } from "@/modules/workspace/constants/routes";
import { ASSET_PERMISSIONS } from "@/modules/workspace/permissions/asset-permission";
import { ASSISTANT_PERMISSIONS } from "@/modules/workspace/permissions/assistant-permission";
import { REMINDER_PERMISSIONS } from "@/modules/workspace/permissions/reminder-permission";
import { SUBSCRIPTION_PERMISSIONS } from "@/modules/workspace/permissions/subscription-permission";
import { Button } from "@/shares/components/ui/button";
import { useSidebar } from "@/shares/components/ui/sidebar";
import { isLocalizedRouteExact, startsWithLocalizedRoute } from "@/shares/lib/localized-route";
import { cn } from "cn";

import { PORTAL_PATHNAMES, PORTAL_ROUTES } from "../../constants/routes";

/**
 * Thanh điều hướng đáy màn hình di động (Bottom Navigation Bar):
 * Lấy tối đa 4 mục ưu tiên đầu tiên còn quyền + nút Menu mở ngăn kéo Sidebar đầy đủ 5 cụm.
 *
 * @returns Thanh điều hướng di động.
 */
export function PortalBottomNav() {
  const t = useTranslations("portal.navigation");
  const tPortal = useTranslations("portal");
  const pathname = usePathname();
  const { data: currentUser } = useCurrentUser();
  const { toggleSidebar } = useSidebar();
  const allPathnames = { ...PORTAL_PATHNAMES, ...WORKSPACE_PATHNAMES };

  const navItems = [
    {
      title: t("dashboard"),
      href: PORTAL_ROUTES.dashboard,
      icon: LayoutDashboard,
      permission: undefined,
      active: isLocalizedRouteExact(pathname, PORTAL_ROUTES.dashboard, allPathnames),
    },
    {
      title: t("assistant"),
      href: WORKSPACE_ROUTES.assistant,
      icon: Bot,
      permission: ASSISTANT_PERMISSIONS.chat,
      active: startsWithLocalizedRoute(pathname, WORKSPACE_ROUTES.assistant, allPathnames),
    },
    {
      title: t("reminders"),
      href: WORKSPACE_ROUTES.reminders,
      icon: BellRing,
      permission: REMINDER_PERMISSIONS.read,
      active: startsWithLocalizedRoute(pathname, WORKSPACE_ROUTES.reminders, allPathnames),
    },
    {
      title: t("subscriptions"),
      href: WORKSPACE_ROUTES.subscriptions,
      icon: CreditCard,
      permission: SUBSCRIPTION_PERMISSIONS.read,
      active: startsWithLocalizedRoute(pathname, WORKSPACE_ROUTES.subscriptions, allPathnames),
    },
    {
      title: t("assets"),
      href: WORKSPACE_ROUTES.assets,
      icon: Laptop,
      permission: ASSET_PERMISSIONS.read,
      active: startsWithLocalizedRoute(pathname, WORKSPACE_ROUTES.assets, allPathnames),
    },
    {
      title: t("pages"),
      href: PORTAL_ROUTES.pages,
      icon: FileText,
      permission: PAGE_PERMISSIONS.read,
      active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.pages, allPathnames),
    },
    {
      title: t("shortLinks"),
      href: PORTAL_ROUTES.shortLinks,
      icon: Link2,
      permission: SHORT_LINK_PERMISSIONS.read,
      active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.shortLinks, allPathnames),
    },
  ]
    .filter((item) => !item.permission || hasPermission(currentUser, item.permission))
    .slice(0, 4);

  return (
    <nav
      aria-label={tPortal("mobileNavAria")}
      className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t px-2 backdrop-blur-md md:hidden"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href as never}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-center transition-colors",
              item.active
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-xl transition-all",
                item.active && "bg-primary/10 text-primary",
              )}
            >
              <Icon className="size-4 shrink-0" />
            </div>
            <span className="truncate text-[10px] leading-tight font-medium">{item.title}</span>
          </Link>
        );
      })}
      <Button
        type="button"
        variant="ghost"
        onClick={toggleSidebar}
        className="text-muted-foreground hover:text-foreground flex h-auto flex-1 flex-col items-center justify-center gap-1 rounded-none py-1 text-center"
      >
        <div className="flex size-7 items-center justify-center rounded-xl">
          <Menu className="size-4 shrink-0" />
        </div>
        <span className="truncate text-[10px] leading-tight font-medium">{t("mobileMenu")}</span>
      </Button>
    </nav>
  );
}
