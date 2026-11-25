"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { useOwnerFilterOptions } from "../../../hooks/use-owner-filter-options";
import { useReportSummary } from "../../../hooks/use-report-summary";
import { INCOME_PERMISSIONS } from "../../../permissions/income-permission";

/**
 * State báo cáo: năm/tháng/người dùng đọc từ URL (`?year=&month=&owner=`) để mở thẳng từ dashboard.
 *
 * @returns Năm, tháng, người dùng, truy vấn, đổi kỳ.
 */
export function useFinanceReport() {
  const params = useSearchParams();
  const currentYear = new Date().getFullYear();
  const urlYear = Number.parseInt(params.get("year") ?? "", 10);
  const initialYear = Number.isFinite(urlYear) && urlYear > 2000 ? urlYear : currentYear;
  const initialMonth = Number(params.get("month")) || null;
  const initialOwner = (params.get("owner") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const [year, setYearState] = useState(initialYear);
  const [month, setMonthState] = useState<number | null>(initialMonth);
  const [owner, setOwnerState] = useState<string[]>(initialOwner);
  const { canFilterOwner, ownerOptions } = useOwnerFilterOptions(INCOME_PERMISSIONS.manageAll);

  const ownerQuery = owner.length ? owner.join(",") : null;
  const query = useReportSummary(year, month, ownerQuery);

  const setPeriod = (nextYear: number, nextMonth: number | null, nextOwner: string[]) => {
    setYearState(nextYear);
    setMonthState(nextMonth);
    setOwnerState(nextOwner);
    const search = new URLSearchParams(window.location.search);
    search.set("year", String(nextYear));
    if (nextMonth) {
      search.set("month", String(nextMonth));
    } else {
      search.delete("month");
    }
    if (nextOwner.length) {
      search.set("owner", nextOwner.join(","));
    } else {
      search.delete("owner");
    }
    const queryStr = search.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${queryStr ? `?${queryStr}` : ""}`,
    );
  };

  return {
    year,
    month,
    owner,
    ownerQuery,
    canFilterOwner,
    ownerOptions,
    years: Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index),
    query,
    setYear: (value: number) => setPeriod(value, month, owner),
    setMonth: (value: number | null) => setPeriod(year, value, owner),
    setOwner: (value: string[]) => setPeriod(year, month, value),
  };
}
