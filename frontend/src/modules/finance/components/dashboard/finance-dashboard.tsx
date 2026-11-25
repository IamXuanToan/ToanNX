"use client";

import { useFormatter, useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { PageHeader } from "@/shares/components/common/page-header";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { useFinanceRoutes } from "../../hooks/use-finance-routes";
import { FinanceCountChart } from "./finance-count-chart";
import { FinanceCumulativeChart } from "./finance-cumulative-chart";
import { FinanceGrowthChart } from "./finance-growth-chart";
import { FinanceKpiCards } from "./finance-kpi-cards";
import { FinancePlatformAreaChart } from "./finance-platform-area-chart";
import { FinanceShareDonut } from "./finance-share-donut";
import { FinanceTaxChart } from "./finance-tax-chart";
import { FinanceTrendChart } from "./finance-trend-chart";
import { useFinanceDashboard } from "./hooks/use-finance-dashboard";
import { YearSelect } from "./year-select";

/**
 * Dashboard tài chính theo năm: KPI so với năm trước, ba đường theo tháng (tổng / đã khấu trừ / chưa khấu trừ),
 * lũy kế, số giao dịch + trung bình, tiền thuế, theo nền tảng, tỷ trọng nền tảng/tiền tệ, % tăng/giảm. Bấm
 * một tháng thì mở Báo cáo đúng tháng đó.
 *
 * @returns Dashboard.
 */
export function FinanceDashboard() {
  const t = useTranslations("finance.dashboard");
  const tReport = useTranslations("finance.report");
  const format = useFormatter();
  const router = useRouter();
  const state = useFinanceDashboard();
  const routes = useFinanceRoutes();
  const openMonth = (month: number) =>
    router.push({
      pathname: routes.reports,
      query: {
        year: String(state.year),
        month: String(month),
        ...(!routes.isPortal && state.owner.length ? { owner: state.owner.join(",") } : {}),
      },
    });
  const monthLabel = (month: number) =>
    format.dateTime(new Date(state.year, month - 1, 1), { month: "short" });
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <div className="flex flex-wrap gap-2">
            {state.canFilterOwner ? (
              <FilterSelect
                label={tReport("owner")}
                options={state.ownerOptions}
                value={state.owner}
                onValueChange={state.setOwner}
              />
            ) : null}
            <YearSelect value={state.year} years={state.years} onChange={state.setYear} />
          </div>
        }
      />
      {state.monthly.isPending ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : state.monthly.isError ? (
        <ErrorState onRetry={() => state.monthly.refetch()} />
      ) : (
        <>
          <FinanceKpiCards kpis={state.kpis} />
          <div className="grid gap-4 xl:grid-cols-3">
            <FinanceTrendChart
              metric="total"
              color="var(--chart-1)"
              points={state.points}
              onMonthClick={openMonth}
            />
            <FinanceTrendChart
              metric="withheld"
              color="var(--chart-2)"
              points={state.points}
              onMonthClick={openMonth}
            />
            <FinanceTrendChart
              metric="notWithheld"
              color="var(--chart-3)"
              points={state.points}
              onMonthClick={openMonth}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <FinanceCumulativeChart points={state.points} />
            <FinanceCountChart points={state.points} />
            <FinanceTaxChart points={state.points} />
            <FinanceGrowthChart points={state.points} />
          </div>
          <FinancePlatformAreaChart
            platforms={state.platformSeries.platforms}
            rows={state.platformSeries.rows}
            monthLabel={monthLabel}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <FinanceShareDonut title={t("charts.platformShare")} items={state.platformShare} />
            <FinanceShareDonut title={t("charts.currencyShare")} items={state.currencyShare} />
          </div>
        </>
      )}
    </div>
  );
}
