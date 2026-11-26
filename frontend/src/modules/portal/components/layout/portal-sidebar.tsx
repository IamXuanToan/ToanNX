"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  Bot,
  CreditCard,
  FileText,
  HeartHandshake,
  History,
  Images,
  KeyRound,
  Landmark,
  Laptop,
  LayoutDashboard,
  Link2,
  ListFilter,
  QrCode,
  Receipt,
  ShieldCheck,
  SlidersHorizontal,
  Store,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { INCOME_PERMISSIONS } from "@/modules/finance/permissions/income-permission";
import { INVOICE_PERMISSIONS } from "@/modules/finance/permissions/invoice-permission";
import { PLATFORM_PERMISSIONS } from "@/modules/finance/permissions/platform-permission";
import { REPORT_PERMISSIONS } from "@/modules/finance/permissions/report-permission";
import { RULE_PERMISSIONS } from "@/modules/finance/permissions/rule-permission";
import { SEPAY_PERMISSIONS } from "@/modules/finance/permissions/sepay-permission";
import { UserMenu } from "@/modules/system/components/current-user/user-menu";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { ATTACHMENT_PERMISSIONS } from "@/modules/system/permissions/attachment-permission";
import { hasPermission } from "@/modules/system/services/current-user.service";
import { DONATION_PERMISSIONS } from "@/modules/utilities/permissions/donation-permission";
import { PAGE_PERMISSIONS } from "@/modules/utilities/permissions/page-permission";
import { QR_CODE_PERMISSIONS } from "@/modules/utilities/permissions/qr-code-permission";
import { SHORT_LINK_PERMISSIONS } from "@/modules/utilities/permissions/short-link-permission";
import { WORKSPACE_PATHNAMES, WORKSPACE_ROUTES } from "@/modules/workspace/constants/routes";
import { ASSET_PERMISSIONS } from "@/modules/workspace/permissions/asset-permission";
import { ASSET_WARRANTY_CLAIM_PERMISSIONS } from "@/modules/workspace/permissions/asset-warranty-claim-permission";
import { ASSISTANT_PERMISSIONS } from "@/modules/workspace/permissions/assistant-permission";
import { MONITOR_INCIDENT_PERMISSIONS } from "@/modules/workspace/permissions/monitor-incident-permission";
import { MONITOR_TARGET_PERMISSIONS } from "@/modules/workspace/permissions/monitor-target-permission";
import { REMINDER_PERMISSIONS } from "@/modules/workspace/permissions/reminder-permission";
import { SUBSCRIPTION_PAYMENT_PERMISSIONS } from "@/modules/workspace/permissions/subscription-payment-permission";
import { SUBSCRIPTION_PERMISSIONS } from "@/modules/workspace/permissions/subscription-permission";
import { VAULT_ITEM_PERMISSIONS } from "@/modules/workspace/permissions/vault-item-permission";
import { WORKSPACE_SETTING_PERMISSIONS } from "@/modules/workspace/permissions/workspace-setting-permission";
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
 * Thanh điều hướng sidebar của Client Portal gồm 5 cụm chức năng:
 * Tổng quan, Cá nhân (Workspace), Tiện ích, Tài chính và Tệp tin.
 *
 * @returns Component Sidebar Portal.
 */
export function PortalSidebar() {
  const t = useTranslations("portal.navigation");
  const tActions = useTranslations("common.actions");
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { data: currentUser } = useCurrentUser();
  const allPathnames = { ...PORTAL_PATHNAMES, ...WORKSPACE_PATHNAMES };

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
          active: isLocalizedRouteExact(pathname, PORTAL_ROUTES.dashboard, allPathnames),
        },
        {
          key: "donations",
          title: t("donations"),
          href: PORTAL_ROUTES.donations,
          icon: HeartHandshake,
          permission: DONATION_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.donations, allPathnames),
        },
      ],
    },
    {
      key: "workspace",
      label: t("sections.workspace"),
      items: [
        {
          key: "assistant",
          title: t("assistant"),
          href: WORKSPACE_ROUTES.assistant,
          icon: Bot,
          permission: ASSISTANT_PERMISSIONS.chat,
          active: startsWithLocalizedRoute(pathname, WORKSPACE_ROUTES.assistant, allPathnames),
        },
        {
          key: "reminders",
          title: t("reminders"),
          href: WORKSPACE_ROUTES.reminders,
          icon: BellRing,
          permission: REMINDER_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, WORKSPACE_ROUTES.reminders, allPathnames),
        },
        {
          key: "subscriptions",
          title: t("subscriptions"),
          href: WORKSPACE_ROUTES.subscriptions,
          icon: CreditCard,
          permission: SUBSCRIPTION_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, WORKSPACE_ROUTES.subscriptions, allPathnames),
        },
        {
          key: "subscriptionPayments",
          title: t("subscriptionPayments"),
          href: WORKSPACE_ROUTES.subscriptionPayments,
          icon: History,
          permission: SUBSCRIPTION_PAYMENT_PERMISSIONS.read,
          active: startsWithLocalizedRoute(
            pathname,
            WORKSPACE_ROUTES.subscriptionPayments,
            allPathnames,
          ),
        },
        {
          key: "assets",
          title: t("assets"),
          href: WORKSPACE_ROUTES.assets,
          icon: Laptop,
          permission: ASSET_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, WORKSPACE_ROUTES.assets, allPathnames),
        },
        {
          key: "warrantyClaims",
          title: t("warrantyClaims"),
          href: WORKSPACE_ROUTES.warrantyClaims,
          icon: ShieldCheck,
          permission: ASSET_WARRANTY_CLAIM_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, WORKSPACE_ROUTES.warrantyClaims, allPathnames),
        },
        {
          key: "vault",
          title: t("vault"),
          href: WORKSPACE_ROUTES.vault,
          icon: KeyRound,
          permission: VAULT_ITEM_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, WORKSPACE_ROUTES.vault, allPathnames),
        },
        {
          key: "monitors",
          title: t("monitors"),
          href: WORKSPACE_ROUTES.monitors,
          icon: Activity,
          permission: MONITOR_TARGET_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, WORKSPACE_ROUTES.monitors, allPathnames),
        },
        {
          key: "monitorIncidents",
          title: t("monitorIncidents"),
          href: WORKSPACE_ROUTES.monitorIncidents,
          icon: AlertTriangle,
          permission: MONITOR_INCIDENT_PERMISSIONS.read,
          active: startsWithLocalizedRoute(
            pathname,
            WORKSPACE_ROUTES.monitorIncidents,
            allPathnames,
          ),
        },
        {
          key: "workspaceSettings",
          title: t("workspaceSettings"),
          href: WORKSPACE_ROUTES.settings,
          icon: SlidersHorizontal,
          permission: WORKSPACE_SETTING_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, WORKSPACE_ROUTES.settings, allPathnames),
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
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.pages, allPathnames),
        },
        {
          key: "shortLinks",
          title: t("shortLinks"),
          href: PORTAL_ROUTES.shortLinks,
          icon: Link2,
          permission: SHORT_LINK_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.shortLinks, allPathnames),
        },
        {
          key: "qrCodes",
          title: t("qrCodes"),
          href: PORTAL_ROUTES.qrCodes,
          icon: QrCode,
          permission: QR_CODE_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.qrCodes, allPathnames),
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
          icon: BarChart3,
          permission: REPORT_PERMISSIONS.read,
          active: isLocalizedRouteExact(pathname, PORTAL_ROUTES.financeDashboard, allPathnames),
        },
        {
          key: "financeIncomes",
          title: t("financeIncomes"),
          href: PORTAL_ROUTES.financeIncomes,
          icon: Landmark,
          permission: INCOME_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.financeIncomes, allPathnames),
        },
        {
          key: "financeInvoices",
          title: t("financeInvoices"),
          href: PORTAL_ROUTES.financeInvoices,
          icon: Receipt,
          permission: INVOICE_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.financeInvoices, allPathnames),
        },
        {
          key: "financePlatforms",
          title: t("financePlatforms"),
          href: PORTAL_ROUTES.financePlatforms,
          icon: Store,
          permission: PLATFORM_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.financePlatforms, allPathnames),
        },
        {
          key: "financeRules",
          title: t("financeRules"),
          href: PORTAL_ROUTES.financeRules,
          icon: ListFilter,
          permission: RULE_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.financeRules, allPathnames),
        },
        {
          key: "financeReports",
          title: t("financeReports"),
          href: PORTAL_ROUTES.financeReports,
          icon: BarChart3,
          permission: REPORT_PERMISSIONS.read,
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.financeReports, allPathnames),
        },
        {
          key: "financeSepay",
          title: t("financeSepay"),
          href: PORTAL_ROUTES.financeSepay,
          icon: Link2,
          permission: SEPAY_PERMISSIONS.manage,
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.financeSepay, allPathnames),
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
          active: startsWithLocalizedRoute(pathname, PORTAL_ROUTES.library, allPathnames),
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
                      <Link href={item.href as never} onClick={() => setOpenMobile(false)}>
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

      <SidebarFooter className="px-3 pt-2 pb-3">
        <UserMenu variant="sidebar" />
      </SidebarFooter>
      <SidebarRail toggleLabel={tActions("toggleSidebar")} />
    </Sidebar>
  );
}
