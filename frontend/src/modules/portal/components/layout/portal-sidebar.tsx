"use client";

import {
  BarChart3,
  FileText,
  HeartHandshake,
  Images,
  Landmark,
  LayoutDashboard,
  Link2,
  ListFilter,
  QrCode,
  Receipt,
  Store,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { ATTACHMENT_PERMISSIONS } from "@/modules/system/permissions/attachment-permission";
import { UserMenu } from "@/modules/system/components/current-user/user-menu";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { hasPermission } from "@/modules/system/services/current-user.service";
import { INCOME_PERMISSIONS } from "@/modules/finance/permissions/income-permission";
import { INVOICE_PERMISSIONS } from "@/modules/finance/permissions/invoice-permission";
import { PLATFORM_PERMISSIONS } from "@/modules/finance/permissions/platform-permission";
import { REPORT_PERMISSIONS } from "@/modules/finance/permissions/report-permission";
import { RULE_PERMISSIONS } from "@/modules/finance/permissions/rule-permission";
import { SEPAY_PERMISSIONS } from "@/modules/finance/permissions/sepay-permission";
import { DONATION_PERMISSIONS } from "@/modules/utilities/permissions/donation-permission";
import { PAGE_PERMISSIONS } from "@/modules/utilities/permissions/page-permission";
import { QR_CODE_PERMISSIONS } from "@/modules/utilities/permissions/qr-code-permission";
import { SHORT_LINK_PERMISSIONS } from "@/modules/utilities/permissions/short-link-permission";
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
import { isLocalizedRouteExact, startsWithLocalizedRoute } from "@/shares/lib/localized-route";

import { PORTAL_PATHNAMES, PORTAL_ROUTES } from "../../constants/routes";

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
  const tActions = useTranslations("common.actions");
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { data: currentUser } = useCurrentUser();

  const rawSections = [
    {
      key: "overview",
      label: t("sections.overview"),
      items: [
        {
          key: "dashboard",
          title: t("dashboard"),
          href: PORTAL_ROUTES.dashboard,
          icon: LayoutDashboard,
          permission: undefined,
          active: isLocalizedRouteExact(pathname, PORTAL_ROUTES.dashboard, PORTAL_PATHNAMES),
        },
        {
          key: "donations",
          title: t("donations"),
          href: PORTAL_ROUTES.donations,
          icon: HeartHandshake,
          permission: DONATION_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.donations, PORTAL_PATHNAMES),
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
          permission: PAGE_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.pages, PORTAL_PATHNAMES),
        },
        {
          key: "shortLinks",
          title: t("shortLinks"),
          href: PORTAL_ROUTES.shortLinks,
          icon: Link2,
          permission: SHORT_LINK_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.shortLinks, PORTAL_PATHNAMES),
        },
        {
          key: "qrCodes",
          title: t("qrCodes"),
          href: PORTAL_ROUTES.qrCodes,
          icon: QrCode,
          permission: QR_CODE_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.qrCodes, PORTAL_PATHNAMES),
        },
      ],
    },
    {
      key: "finance",
      label: t("sections.finance"),
      items: [
        {
          key: "financeDashboard",
          title: t("financeDashboard"),
          href: PORTAL_ROUTES.financeDashboard,
          icon: LayoutDashboard,
          permission: REPORT_PERMISSIONS.read,
          active: isLocalizedRouteExact(pathname, PORTAL_ROUTES.financeDashboard, PORTAL_PATHNAMES),
        },
        {
          key: "financeIncomes",
          title: t("financeIncomes"),
          href: PORTAL_ROUTES.financeIncomes,
          icon: Receipt,
          permission: INCOME_PERMISSIONS.read,
          active: startsWithLocalizedRoute(
            pathname,
            PORTAL_ROUTES.financeIncomes,
            PORTAL_PATHNAMES,
          ),
        },
        {
          key: "financeInvoices",
          title: t("financeInvoices"),
          href: PORTAL_ROUTES.financeInvoices,
          icon: FileText,
          permission: INVOICE_PERMISSIONS.read,
          active: startsWithLocalizedRoute(
            pathname,
            PORTAL_ROUTES.financeInvoices,
            PORTAL_PATHNAMES,
          ),
        },
        {
          key: "financePlatforms",
          title: t("financePlatforms"),
          href: PORTAL_ROUTES.financePlatforms,
          icon: Store,
          permission: PLATFORM_PERMISSIONS.read,
          active: startsWithLocalizedRoute(
            pathname,
            PORTAL_ROUTES.financePlatforms,
            PORTAL_PATHNAMES,
          ),
        },
        {
          key: "financeRules",
          title: t("financeRules"),
          href: PORTAL_ROUTES.financeRules,
          icon: ListFilter,
          permission: RULE_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.financeRules, PORTAL_PATHNAMES),
        },
        {
          key: "financeReports",
          title: t("financeReports"),
          href: PORTAL_ROUTES.financeReports,
          icon: BarChart3,
          permission: REPORT_PERMISSIONS.read,
          active: startsWithLocalizedRoute(
            pathname,
            PORTAL_ROUTES.financeReports,
            PORTAL_PATHNAMES,
          ),
        },
        {
          key: "financeSepay",
          title: t("financeSepay"),
          href: PORTAL_ROUTES.financeSepay,
          icon: Landmark,
          permission: SEPAY_PERMISSIONS.manage,
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.financeSepay, PORTAL_PATHNAMES),
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
          permission: ATTACHMENT_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.library, PORTAL_PATHNAMES),
        },
      ],
    },
  ];

  const sections = rawSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permission || hasPermission(currentUser, item.permission),
      ),
    }))
    .filter((section) => section.items.length > 0);

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
      <SidebarRail toggleLabel={tActions("toggleSidebar")} />
    </Sidebar>
  );
}
