"use client";

import { useQuery } from "@tanstack/react-query";

import { financeKeys } from "../constants/query-keys";
import { financeReportService } from "../services/finance-report.service";

/** @param year - Năm. @param owner - Lọc theo người dùng. @param options - Tùy chọn bật/tắt truy vấn. @returns Dữ liệu dashboard theo tháng. */
export function useReportMonthly(
  year: number,
  owner?: string | null,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: financeKeys.reportMonthly(year, owner),
    queryFn: ({ signal }) => financeReportService.monthly(year, owner, signal),
    enabled: options.enabled ?? true,
  });
}
