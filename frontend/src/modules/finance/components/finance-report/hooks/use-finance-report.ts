"use client";

import { useSearchParams } from "next/navigation";

import { useRouter, usePathname } from "@/i18n/navigation";

import { useReportSummary } from "../../../hooks/use-report-summary";

/**
 * State báo cáo: năm/tháng đọc từ URL (`?year=&month=`) để mở thẳng từ dashboard.
 *
 * @returns Năm, tháng, truy vấn, đổi kỳ.
 */
export function useFinanceReport() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const year = Number(params.get("year")) || new Date().getFullYear();
  const month = Number(params.get("month")) || null;
  const query = useReportSummary(year, month);
  const setPeriod = (nextYear: number, nextMonth: number | null) => {
    const search = new URLSearchParams({ year: String(nextYear) });
    if (nextMonth) search.set("month", String(nextMonth));
    router.replace(`${pathname}?${search.toString()}` as never);
  };
  return {
    year,
    month,
    years: Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index),
    query,
    setYear: (value: number) => setPeriod(value, month),
    setMonth: (value: number | null) => setPeriod(year, value),
  };
}
