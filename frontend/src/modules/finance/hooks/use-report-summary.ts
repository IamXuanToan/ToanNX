"use client";

import { useQuery } from "@tanstack/react-query";

import { financeKeys } from "../constants/query-keys";
import { financeReportService } from "../services/finance-report.service";

/** @param year - Năm. @param month - Tháng hoặc null. @param owner - Lọc theo người dùng. @returns Báo cáo. */
export function useReportSummary(year: number, month: number | null, owner?: string | null) {
  return useQuery({
    queryKey: financeKeys.reportSummary({ year, month, owner: owner ?? null }),
    queryFn: ({ signal }) => financeReportService.summary(year, month, owner, signal),
  });
}
