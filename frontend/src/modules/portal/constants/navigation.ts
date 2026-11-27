import {
  BarChart3,
  BellRing,
  CreditCard,
  FileText,
  HeartHandshake,
  Images,
  KeyRound,
  Landmark,
  Laptop,
  LayoutDashboard,
  Link2,
  type LucideIcon,
  QrCode,
  Receipt,
  SlidersHorizontal,
  Store,
} from "lucide-react";

import { INCOME_PERMISSIONS } from "@/modules/finance/permissions/income-permission";
import { INVOICE_PERMISSIONS } from "@/modules/finance/permissions/invoice-permission";
import { PLATFORM_PERMISSIONS } from "@/modules/finance/permissions/platform-permission";
import { REPORT_PERMISSIONS } from "@/modules/finance/permissions/report-permission";
import { SEPAY_PERMISSIONS } from "@/modules/finance/permissions/sepay-permission";
import { ATTACHMENT_PERMISSIONS } from "@/modules/system/permissions/attachment-permission";
import { DONATION_PERMISSIONS } from "@/modules/utilities/permissions/donation-permission";
import { PAGE_PERMISSIONS } from "@/modules/utilities/permissions/page-permission";
import { QR_CODE_PERMISSIONS } from "@/modules/utilities/permissions/qr-code-permission";
import { SHORT_LINK_PERMISSIONS } from "@/modules/utilities/permissions/short-link-permission";
import { WORKSPACE_PATHNAMES, WORKSPACE_ROUTES } from "@/modules/workspace/constants/routes";
import { ASSET_PERMISSIONS } from "@/modules/workspace/permissions/asset-permission";
import { REMINDER_PERMISSIONS } from "@/modules/workspace/permissions/reminder-permission";
import { SUBSCRIPTION_PERMISSIONS } from "@/modules/workspace/permissions/subscription-permission";
import { VAULT_ITEM_PERMISSIONS } from "@/modules/workspace/permissions/vault-item-permission";
import { WORKSPACE_SETTING_PERMISSIONS } from "@/modules/workspace/permissions/workspace-setting-permission";
import { isLocalizedRouteExact, startsWithLocalizedRoute } from "@/shares/lib/localized-route";

import type portalMessages from "../messages/vi.json";
import { PORTAL_PATHNAMES, PORTAL_ROUTES } from "./routes";

type PortalNavNamespace = typeof portalMessages.navigation;

/** Khóa dịch hợp lệ cho nhãn một mục menu trong namespace `portal.navigation`. */
export type PortalNavItemLabelKey = Exclude<keyof PortalNavNamespace, "sections">;

/** Khóa dịch hợp lệ cho nhãn một cụm menu trong namespace `portal.navigation`. */
export type PortalNavSectionLabelKey = `sections.${keyof PortalNavNamespace["sections"] & string}`;

/** Đường dẫn đa ngôn ngữ hợp nhất giữa Portal và Workspace để so khớp active route chính xác. */
export const PORTAL_ALL_PATHNAMES = { ...PORTAL_PATHNAMES, ...WORKSPACE_PATHNAMES };

/** Khóa `localStorage` ghi nhớ trạng thái đóng/mở từng nhóm trên Sidebar Portal. */
export const PORTAL_SIDEBAR_COLLAPSED_KEY = "portal_sidebar_collapsed_sections";

/** Khai báo một mục điều hướng trong Sidebar / Bottom Nav của Client Portal. */
export type PortalNavItemConfig = {
  key: string;
  labelKey: PortalNavItemLabelKey;
  href: string;
  icon: LucideIcon;
  permission?: string;
  exact?: boolean;
  /** Các route con/ẩn khỏi sidebar nhưng vẫn làm mục cha sáng đèn (vd: `/portal/warranty-claims` sáng `Thiết bị`). */
  alsoMatch?: readonly string[];
};

/** Khai báo một cụm mục menu trên Sidebar Client Portal. */
export type PortalNavSectionConfig = {
  key: string;
  labelKey: PortalNavSectionLabelKey;
  /** Bỏ nhãn cụm và cơ chế thu gọn (dành cho mục gốc Tổng quan đứng đầu). */
  hideHeader?: boolean;
  items: readonly PortalNavItemConfig[];
};

/**
 * Danh sách cụm menu tối ưu của Client Portal:
 * - Gộp các màn con nhật ký/lịch sử/cài đặt (Phiếu bảo hành, Lịch sử gia hạn, Cài đặt Trợ lý)
 *   vào bên trong từng mục cha (`Thiết bị`, `Dịch vụ`, `Trợ lý AI`) để sidebar gọn còn 4 cụm chính.
 * - Gộp `Thư viện` (trước đây lẻ 1 mục ở cuối) vào cụm `Tiện ích`.
 */
export const PORTAL_NAV_SECTIONS: readonly PortalNavSectionConfig[] = [
  {
    key: "overview",
    labelKey: "sections.overview",
    hideHeader: true,
    items: [
      {
        key: "dashboard",
        labelKey: "dashboard",
        href: PORTAL_ROUTES.dashboard,
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    key: "workspace",
    labelKey: "sections.workspace",
    items: [
      {
        key: "reminders",
        labelKey: "reminders",
        href: WORKSPACE_ROUTES.reminders,
        icon: BellRing,
        permission: REMINDER_PERMISSIONS.read,
      },
      {
        key: "subscriptions",
        labelKey: "subscriptions",
        href: WORKSPACE_ROUTES.subscriptions,
        icon: CreditCard,
        permission: SUBSCRIPTION_PERMISSIONS.read,
        alsoMatch: [WORKSPACE_ROUTES.subscriptionPayments],
      },
      {
        key: "assets",
        labelKey: "assets",
        href: WORKSPACE_ROUTES.assets,
        icon: Laptop,
        permission: ASSET_PERMISSIONS.read,
        alsoMatch: [WORKSPACE_ROUTES.warrantyClaims],
      },
      {
        key: "vault",
        labelKey: "vault",
        href: WORKSPACE_ROUTES.vault,
        icon: KeyRound,
        permission: VAULT_ITEM_PERMISSIONS.read,
      },
      {
        key: "workspaceSettings",
        labelKey: "workspaceSettings",
        href: WORKSPACE_ROUTES.settings,
        icon: SlidersHorizontal,
        permission: WORKSPACE_SETTING_PERMISSIONS.read,
      },
    ],
  },
  {
    key: "utilities",
    labelKey: "sections.utilities",
    items: [
      {
        key: "pages",
        labelKey: "pages",
        href: PORTAL_ROUTES.pages,
        icon: FileText,
        permission: PAGE_PERMISSIONS.read,
      },
      {
        key: "shortLinks",
        labelKey: "shortLinks",
        href: PORTAL_ROUTES.shortLinks,
        icon: Link2,
        permission: SHORT_LINK_PERMISSIONS.read,
      },
      {
        key: "qrCodes",
        labelKey: "qrCodes",
        href: PORTAL_ROUTES.qrCodes,
        icon: QrCode,
        permission: QR_CODE_PERMISSIONS.read,
      },
      {
        key: "donations",
        labelKey: "donations",
        href: PORTAL_ROUTES.donations,
        icon: HeartHandshake,
        permission: DONATION_PERMISSIONS.read,
      },
      {
        key: "files",
        labelKey: "files",
        href: PORTAL_ROUTES.library,
        icon: Images,
        permission: ATTACHMENT_PERMISSIONS.read,
      },
    ],
  },
  {
    key: "finance",
    labelKey: "sections.finance",
    items: [
      {
        key: "financeIncomes",
        labelKey: "financeIncomes",
        href: PORTAL_ROUTES.financeIncomes,
        icon: Landmark,
        permission: INCOME_PERMISSIONS.read,
      },
      {
        key: "financeInvoices",
        labelKey: "financeInvoices",
        href: PORTAL_ROUTES.financeInvoices,
        icon: Receipt,
        permission: INVOICE_PERMISSIONS.read,
      },
      {
        key: "financePlatforms",
        labelKey: "financePlatforms",
        href: PORTAL_ROUTES.financePlatforms,
        icon: Store,
        permission: PLATFORM_PERMISSIONS.read,
      },
      {
        key: "financeReports",
        labelKey: "financeReports",
        href: PORTAL_ROUTES.financeReports,
        icon: BarChart3,
        permission: REPORT_PERMISSIONS.read,
      },
      {
        key: "financeSepay",
        labelKey: "financeSepay",
        href: PORTAL_ROUTES.financeSepay,
        icon: Link2,
        permission: SEPAY_PERMISSIONS.manage,
      },
    ],
  },
];

/** Thứ tự ưu tiên tối đa 4 mục hiển thị nhanh trên Bottom Nav di động. */
export const PORTAL_BOTTOM_NAV_KEYS = [
  "dashboard",
  "reminders",
  "subscriptions",
  "assets",
  "pages",
  "shortLinks",
] as const;

/**
 * Kiểm tra một mục menu Portal có đang khớp với `pathname` hiện tại hay không
 * (tính cả các route con ẩn như `/bao-hanh`, `/gia-han`, `/su-co`, `/cai-dat`).
 *
 * @param pathname - Đường dẫn hiện tại từ `usePathname()`.
 * @param item - Cấu hình mục menu.
 * @returns `true` nếu mục đang active.
 */
export function isPortalNavItemActive(pathname: string, item: PortalNavItemConfig): boolean {
  if (item.exact) {
    return isLocalizedRouteExact(pathname, item.href, PORTAL_ALL_PATHNAMES);
  }
  if (startsWithLocalizedRoute(pathname, item.href, PORTAL_ALL_PATHNAMES)) {
    return true;
  }
  return Boolean(
    item.alsoMatch?.some((extraHref) =>
      startsWithLocalizedRoute(pathname, extraHref, PORTAL_ALL_PATHNAMES),
    ),
  );
}
