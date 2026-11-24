"use client";

import { FileText, Images, LayoutDashboard, Link2, QrCode } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { UserMenu } from "@/modules/system/components/current-user/user-menu";
import { LogoMark } from "@/shares/components/layout/logo-mark";
import { Badge } from "@/shares/components/ui/badge";
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

import { PORTAL_ROUTES } from "../../constants/routes";

const NAV_LINK_CLASS =
  "text-foreground/70 hover:bg-item-hover hover:text-foreground data-active:bg-primary-light data-active:text-primary data-active:hover:bg-primary-light data-active:hover:text-primary h-10 gap-2.5 rounded-xl px-3 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-3!";

/**
 * Thanh điều hướng sidebar của Client Portal:
 * Chuẩn hóa theo thiết kế của Admin, hỗ trợ thu gọn dải icon (collapsible="icon"),
 * chia nhóm rõ ràng (Tổng quan, Tiện ích, Tệp tin), trạng thái active mượt mà và footer tài khoản.
 *
 * @returns Component Sidebar Portal.
 */
export function PortalSidebar() {
  const t = useTranslations("portal.navigation");
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const sections = [
    {
      key: "overview",
      label: t("sections.overview"),
      items: [
        {
          key: "dashboard",
          title: t("dashboard"),
          href: PORTAL_ROUTES.dashboard,
          icon: LayoutDashboard,
          active: pathname === PORTAL_ROUTES.dashboard || (pathname as string) === "/ca-nhan",
        },
      ],
    },
    {
      key: "utilities",
      label: t("sections.utilities"),
      items: [
        {
          key: "pages",
          title: t("pages"),
          href: PORTAL_ROUTES.pages,
          icon: FileText,
          active:
            pathname.startsWith(PORTAL_ROUTES.pages) ||
            (pathname as string).startsWith("/ca-nhan/trang"),
        },
        {
          key: "shortLinks",
          title: t("shortLinks"),
          href: PORTAL_ROUTES.shortLinks,
          icon: Link2,
          active:
            pathname.startsWith(PORTAL_ROUTES.shortLinks) ||
            (pathname as string).startsWith("/ca-nhan/link-rut-gon"),
        },
        {
          key: "qrCodes",
          title: t("qrCodes"),
          href: PORTAL_ROUTES.qrCodes,
          icon: QrCode,
          active:
            pathname.startsWith(PORTAL_ROUTES.qrCodes) ||
            (pathname as string).startsWith("/ca-nhan/ma-qr"),
        },
      ],
    },
    {
      key: "media",
      label: t("sections.media"),
      items: [
        {
          key: "files",
          title: t("files"),
          href: PORTAL_ROUTES.library,
          icon: Images,
          active:
            pathname.startsWith(PORTAL_ROUTES.library) ||
            (pathname as string).startsWith("/ca-nhan/thu-vien"),
        },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon">
      {/* Brand Header */}
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

      {/* Nav Menu Items theo Cụm nhóm */}
      <SidebarContent className="px-3 py-3 group-data-[collapsible=icon]:[scrollbar-width:none] group-data-[collapsible=icon]:overflow-y-auto">
        {sections.map((section, index) => (
          <div key={section.key} className="mt-2 first:mt-0">
            <div className="text-muted-foreground/80 flex h-7 items-center truncate px-3 text-[11px] font-medium tracking-wider uppercase group-data-[collapsible=icon]:hidden">
              {section.label}
            </div>
            {index > 0 ? (
              <span
                aria-hidden
                className="bg-border mx-auto my-2 hidden h-px w-6 group-data-[collapsible=icon]:block"
              />
            ) : null}
            <SidebarMenu className="gap-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.active}
                      tooltip={`${section.label} › ${item.title}`}
                      className={NAV_LINK_CLASS}
                    >
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
                        <Icon aria-hidden className="size-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>

      {/* Footer chứa thông tin tài khoản */}
      <SidebarFooter className="px-3 pt-2 pb-3">
        <UserMenu variant="sidebar" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
