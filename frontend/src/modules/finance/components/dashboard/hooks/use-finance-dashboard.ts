"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { useOwnerFilterOptions } from "../../../hooks/use-owner-filter-options";
import { useReportMonthly } from "../../../hooks/use-report-monthly";
import { useReportSummary } from "../../../hooks/use-report-summary";
import { buildMonthSeries, buildPlatformSeries, changePercent } from "../../../lib/report-series";
import { INCOME_PERMISSIONS } from "../../../permissions/income-permission";

/**
 * State dashboard: năm chọn, người dùng (nếu có quyền), chuỗi 12 tháng (năm chọn + năm trước),
 * theo nền tảng, tỷ trọng nền tảng/tiền tệ, KPI so với cùng kỳ năm trước.
 *
 * @returns Truy vấn và dữ liệu đã dựng.
 */
export function useFinanceDashboard(options?: { enabled?: boolean }) {
  const t = useTranslations("finance.dashboard");
  const format = useFormatter();
  const searchParams = useSearchParams();
  const enabled = options?.enabled ?? true;
  const urlYear = Number.parseInt(searchParams.get("year") ?? "", 10);
  const currentYear = new Date().getFullYear();
  const initialYear = Number.isFinite(urlYear) && urlYear > 2000 ? urlYear : currentYear;
  const { isPortal, personalOwnerId, scopeReady, canFilterOwner, ownerOptions } =
    useOwnerFilterOptions(INCOME_PERMISSIONS.manageAll);

  const initialOwner = isPortal
    ? []
    : (searchParams.get("owner") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  const [year, setYearState] = useState(initialYear);
  const [ownerState, setOwnerState] = useState<string[]>(initialOwner);
  const owner = isPortal ? [] : ownerState;

  const replaceUrl = (nextYear: number, nextOwner: string[]) => {
    const params = new URLSearchParams(window.location.search);
    if (nextYear === currentYear) {
      params.delete("year");
    } else {
      params.set("year", String(nextYear));
    }
    if (!isPortal && nextOwner.length) {
      params.set("owner", nextOwner.join(","));
    } else {
      params.delete("owner");
    }
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  const setYear = (nextYear: number) => {
    setYearState(nextYear);
    replaceUrl(nextYear, owner);
  };
  const setOwner = (nextOwner: string[]) => {
    if (isPortal) return;
    setOwnerState(nextOwner);
    replaceUrl(year, nextOwner);
  };
  const ownerQuery = isPortal ? personalOwnerId : owner.length ? owner.join(",") : null;
  const monthly = useReportMonthly(year, ownerQuery, { enabled: scopeReady && enabled });
  const summary = useReportSummary(year, null, ownerQuery, { enabled: scopeReady && enabled });
  const monthLabel = (month: number) =>
    format.dateTime(new Date(year, month - 1, 1), { month: "short" });
  const points = monthly.data ? buildMonthSeries(monthly.data, monthLabel) : [];
  const platformSeries = monthly.data
    ? buildPlatformSeries(monthly.data, t("unclassified"))
    : { platforms: [], platformColors: {} as Record<string, string>, rows: [] };
  const sum = (key: "total" | "withheld" | "notWithheld" | "tax" | "count", previous = false) =>
    (previous ? monthly.data?.previousMonths : monthly.data?.months)?.reduce(
      (acc, row) => acc + Number(row[key]),
      0,
    ) ?? 0;
  const kpis = (["total", "withheld", "notWithheld", "tax", "count"] as const).map((key) => ({
    key,
    value: sum(key),
    change: changePercent(sum(key), sum(key, true)),
  }));
  const platformShare = Object.values(
    (summary.data?.byPlatform ?? []).reduce<
      Record<string, { name: string; value: number; color?: string }>
    >((acc, row) => {
      const name = row.platform || t("unclassified");
      acc[name] = {
        name,
        value: (acc[name]?.value ?? 0) + Number(row.total),
        color: acc[name]?.color || row.color || undefined,
      };
      return acc;
    }, {}),
  );
  const currencyShare = (summary.data?.byCurrency ?? []).map((row) => ({
    name: row.currency,
    value: Number(row.total),
  }));
  return {
    year,
    setYear,
    owner,
    setOwner,
    canFilterOwner,
    ownerOptions,
    years: Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index),
    monthly,
    points,
    platformSeries,
    kpis,
    platformShare,
    currencyShare,
  };
}
