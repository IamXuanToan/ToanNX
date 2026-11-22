"use client";

import { useQuery } from "@tanstack/react-query";

import { financeKeys } from "../constants/query-keys";
import { financeReportService } from "../services/finance-report.service";

/** @param year - Năm. @returns Dữ liệu dashboard theo tháng. */
export function useReportMonthly(year: number) {
  return useQuery({
    queryKey: financeKeys.reportMonthly(year),
    queryFn: ({ signal }) => financeReportService.monthly(year, signal),
  });
}
