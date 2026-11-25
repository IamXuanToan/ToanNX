"use client";

import { usePathname } from "@/i18n/navigation";
import { PORTAL_PATHNAMES, PORTAL_ROUTES } from "@/modules/portal/constants/routes";
import { startsWithLocalizedRoute } from "@/shares/lib/localized-route";

import { FINANCE_ROUTES } from "../constants/routes";

/**
 * Hook trả về tập route chuẩn của Finance theo ngữ cảnh hiện tại:
 * - Nếu đang ở Client Portal (`/portal` hay `/ca-nhan`): trả về các route của Portal (`/portal/finance/...`).
 * - Nếu đang ở Admin (`/admin` hay `/quan-tri`): trả về các route của Admin (`/admin/finance/...`).
 *
 * Giúp tái sử dụng hoàn toàn các Form, Profile, Table của module Finance mà không bao giờ bị lệch URL hay nhảy sai trang.
 *
 * @returns Tập route tương ứng với ngữ cảnh hiện tại.
 */
export function useFinanceRoutes() {
  const pathname = usePathname();
  const isPortal = startsWithLocalizedRoute(pathname, PORTAL_ROUTES.dashboard, PORTAL_PATHNAMES);

  if (isPortal) {
    return {
      dashboard: PORTAL_ROUTES.financeDashboard,
      reports: PORTAL_ROUTES.financeReports,
      sepay: PORTAL_ROUTES.financeSepay,
      incomes: PORTAL_ROUTES.financeIncomes,
      incomeCreate: PORTAL_ROUTES.financeIncomeCreate,
      incomeDetail: PORTAL_ROUTES.financeIncomeDetail,
      invoices: PORTAL_ROUTES.financeInvoices,
      invoiceCreate: PORTAL_ROUTES.financeInvoiceCreate,
      invoiceDetail: PORTAL_ROUTES.financeInvoiceDetail,
      platforms: PORTAL_ROUTES.financePlatforms,
      platformCreate: PORTAL_ROUTES.financePlatformCreate,
      platformDetail: PORTAL_ROUTES.financePlatformDetail,
      rules: PORTAL_ROUTES.financeRules,
      ruleCreate: PORTAL_ROUTES.financeRuleCreate,
      ruleDetail: PORTAL_ROUTES.financeRuleDetail,
    };
  }

  return {
    ...FINANCE_ROUTES,
    platforms: PORTAL_ROUTES.financePlatforms,
    platformCreate: PORTAL_ROUTES.financePlatformCreate,
    platformDetail: PORTAL_ROUTES.financePlatformDetail,
    rules: PORTAL_ROUTES.financeRules,
    ruleCreate: PORTAL_ROUTES.financeRuleCreate,
    ruleDetail: PORTAL_ROUTES.financeRuleDetail,
    sepay: PORTAL_ROUTES.financeSepay,
  };
}
