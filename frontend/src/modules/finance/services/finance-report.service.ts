import { apiClient } from "@/shares/lib/api/api-client";

import { FINANCE_API_ENDPOINTS } from "../constants/api-endpoints";
import type { ReportMonthly, ReportSummary } from "../types/finance-report.types";

/** Service báo cáo (BE `finance/services/finance_report_service.py`). */
export const financeReportService = {
  /** @param year - Năm. @param month - Tháng (null = cả năm). @param owner - Lọc theo người dùng. @returns Báo cáo. */
  async summary(
    year: number,
    month: number | null,
    owner?: string | null,
    signal?: AbortSignal,
  ): Promise<ReportSummary> {
    return (
      await apiClient.get<ReportSummary>(FINANCE_API_ENDPOINTS.reportSummary, {
        query: { year, month: month ?? undefined, owner: owner || undefined },
        signal,
      })
    ).data;
  },

  /** @param year - Năm. @param owner - Lọc theo người dùng. @returns 12 tháng năm chọn + năm trước. */
  async monthly(year: number, owner?: string | null, signal?: AbortSignal): Promise<ReportMonthly> {
    return (
      await apiClient.get<ReportMonthly>(FINANCE_API_ENDPOINTS.reportMonthly, {
        query: { year, owner: owner || undefined },
        signal,
      })
    ).data;
  },
};
