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
 * @returns Tập route tương ứng với ngữ cảnh hiện tại.
 */
export function useFinanceRoutes() {
  const pathname = usePathname();
  const isPortal = startsWithLocalizedRoute(pathname, PORTAL_ROUTES.dashboard, PORTAL_PATHNAMES);

  if (isPortal) {
    return {
      isPortal: true,
      dashboard: PORTAL_ROUTES.dashboard,
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
    };
  }

  return {
    ...FINANCE_ROUTES,
    isPortal: false,
    platforms: PORTAL_ROUTES.financePlatforms,
    platformCreate: PORTAL_ROUTES.financePlatformCreate,
    platformDetail: PORTAL_ROUTES.financePlatformDetail,
    sepay: PORTAL_ROUTES.financeSepay,
  };
}
