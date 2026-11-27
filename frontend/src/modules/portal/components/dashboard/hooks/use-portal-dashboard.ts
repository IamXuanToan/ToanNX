"use client";

import { useQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { useFinanceDashboard } from "@/modules/finance/components/dashboard/hooks/use-finance-dashboard";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { donationService } from "@/modules/utilities/services/donation.service";
import { pageService } from "@/modules/utilities/services/page.service";
import { shortLinkService } from "@/modules/utilities/services/short-link.service";

import { portalKeys } from "../../../constants/query-keys";
import { PORTAL_ROUTES } from "../../../constants/routes";

/**
 * Hook dữ liệu hợp nhất cho Client Portal Dashboard:
 * Tải danh sách Trang, Link rút gọn, Thống kê Quyên góp cá nhân và Dữ liệu Dashboard Tài chính
 * (tôn trọng từng cờ quyền để không gọi API dư thừa).
 *
 * @param options - Cờ quyền đọc của trang.
 * @returns State hợp nhất và handler điều hướng cho `PortalDashboard`.
 */
export function usePortalDashboard({
  canReadPages = false,
  canReadShortLinks = false,
  canReadDonations = false,
  canReadFinanceReports = false,
}: {
  canReadPages?: boolean;
  canReadShortLinks?: boolean;
  canReadDonations?: boolean;
  canReadFinanceReports?: boolean;
}) {
  const t = useTranslations("portal.dashboard");
  const format = useFormatter();
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.user.id;

  const finance = useFinanceDashboard({ enabled: canReadFinanceReports });

  const pagesQuery = useQuery({
    queryKey: portalKeys.dashboardPages(userId),
    queryFn: ({ signal }) =>
      pageService.list({ owner: userId ? [userId] : undefined, pageSize: 5 }, signal),
    enabled: Boolean(userId) && canReadPages,
  });

  const linksQuery = useQuery({
    queryKey: portalKeys.dashboardLinks(userId),
    queryFn: ({ signal }) =>
      shortLinkService.list({ owner: userId ? [userId] : undefined, pageSize: 5 }, signal),
    enabled: Boolean(userId) && canReadShortLinks,
  });

  const donationStatsQuery = useQuery({
    queryKey: portalKeys.dashboardDonations(userId),
    queryFn: ({ signal }) => donationService.stats({ owner: userId }, signal),
    enabled: Boolean(userId) && canReadDonations,
  });

  const pages = (pagesQuery.data?.items ?? []).filter((p) => !userId || p.owner.id === userId);
  const links = (linksQuery.data?.items ?? []).filter((l) => !userId || l.owner.id === userId);
  const totalClicks = links.reduce((sum, item) => sum + (item.clicksCount ?? 0), 0);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("copied"));
  };

  const monthLabel = (month: number) =>
    format.dateTime(new Date(finance.year, month - 1, 1), { month: "short" });

  const openMonthReport = (month: number) =>
    router.push({
      pathname: PORTAL_ROUTES.financeReports,
      query: {
        year: String(finance.year),
        month: String(month),
      },
    });

  return {
    currentUser,
    finance,
    pages,
    links,
    totalClicks,
    linksQuery,
    donationStats: donationStatsQuery.data,
    donationStatsQuery,
    handleCopy,
    monthLabel,
    openMonthReport,
  };
}
