"use client";

import { FileText, Images, LayoutDashboard, Link2, QrCode } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "cn";

import { PORTAL_ROUTES } from "../../constants/routes";

/**
 * Thanh điều hướng đáy màn hình (Bottom Navigation Bar) tối ưu trải nghiệm chạm vuốt trên Mobile:
 * Luôn cố định ở chân màn hình điện thoại giúp người dùng chuyển đổi chức năng nhanh chóng.
 *
 * @returns Thanh điều hướng di động.
 */
export function PortalBottomNav() {
  const t = useTranslations("portal.navigation");
  const tPortal = useTranslations("portal");
  const pathname = usePathname();

  const navItems = [
    {
      title: t("dashboard"),
      href: PORTAL_ROUTES.dashboard,
      icon: LayoutDashboard,
      active: pathname === PORTAL_ROUTES.dashboard || (pathname as string) === "/ca-nhan",
    },
    {
      title: t("pages"),
      href: PORTAL_ROUTES.pages,
      icon: FileText,
      active:
        pathname.startsWith(PORTAL_ROUTES.pages) ||
        (pathname as string).startsWith("/ca-nhan/trang"),
    },
    {
      title: t("shortLinks"),
      href: PORTAL_ROUTES.shortLinks,
      icon: Link2,
      active:
        pathname.startsWith(PORTAL_ROUTES.shortLinks) ||
        (pathname as string).startsWith("/ca-nhan/link-rut-gon"),
    },
    {
      title: t("qrCodes"),
      href: PORTAL_ROUTES.qrCodes,
      icon: QrCode,
      active:
        pathname.startsWith(PORTAL_ROUTES.qrCodes) ||
        (pathname as string).startsWith("/ca-nhan/ma-qr"),
    },
    {
      title: t("files"),
      href: PORTAL_ROUTES.library,
      icon: Images,
      active:
        pathname.startsWith(PORTAL_ROUTES.library) ||
        (pathname as string).startsWith("/ca-nhan/thu-vien"),
    },
  ];

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
            href={item.href}
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
    </nav>
  );
}
