"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { hasPermission } from "@/modules/system/services/current-user.service";
import { Button } from "@/shares/components/ui/button";
import { useSidebar } from "@/shares/components/ui/sidebar";
import { cn } from "cn";

import {
  isPortalNavItemActive,
  PORTAL_BOTTOM_NAV_KEYS,
  PORTAL_NAV_SECTIONS,
} from "../../constants/navigation";

const ALL_NAV_ITEMS = PORTAL_NAV_SECTIONS.flatMap((section) => section.items);

/**
 * Thanh điều hướng đáy màn hình di động (Bottom Navigation Bar):
 * dùng chung khai báo từ `PORTAL_NAV_SECTIONS`, lấy tối đa 4 mục ưu tiên còn quyền + nút Mở Drawer.
 *
 * @returns Thanh điều hướng di động.
 */
export function PortalBottomNav() {
  const t = useTranslations("portal.navigation");
  const tPortal = useTranslations("portal");
  const pathname = usePathname();
  const { data: currentUser } = useCurrentUser();
  const { toggleSidebar } = useSidebar();

  const navItems = PORTAL_BOTTOM_NAV_KEYS.map((key) => ALL_NAV_ITEMS.find((i) => i.key === key))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => !item.permission || hasPermission(currentUser, item.permission))
    .slice(0, 4)
    .map((item) => ({
      title: t(item.labelKey),
      href: item.href,
      icon: item.icon,
      active: isPortalNavItemActive(pathname, item),
    }));

  return (
    <nav
      aria-label={tPortal("mobileNavAria")}
      className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 items-center border-t px-1 backdrop-blur-md md:hidden"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href as never}
            className={cn(
              "flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-1 text-center transition-colors",
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
            <span className="w-full truncate text-[10px] leading-tight font-medium">
              {item.title}
            </span>
          </Link>
        );
      })}
      <Button
        type="button"
        variant="ghost"
        onClick={toggleSidebar}
        className="text-muted-foreground hover:text-foreground flex h-auto min-w-0 flex-col items-center justify-center gap-1 rounded-none px-1 py-1 text-center"
      >
        <div className="flex size-7 items-center justify-center rounded-xl">
          <Menu className="size-4 shrink-0" />
        </div>
        <span className="w-full truncate text-[10px] leading-tight font-medium">
          {t("mobileMenu")}
        </span>
      </Button>
    </nav>
  );
}
