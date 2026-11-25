"use client";

import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/shares/components/ui/card";
import { formatDisplayMoney, formatDisplayNumber } from "@/shares/lib/number-format";

/**
 * Thẻ KPI năm chọn kèm % so với cùng kỳ năm trước.
 *
 * @param props - KPI.
 * @returns Lưới thẻ.
 */
type KpiKey = "total" | "withheld" | "notWithheld" | "tax" | "count";

export function FinanceKpiCards({
  kpis,
}: {
  kpis: { key: KpiKey; value: number; change: number | null }[];
}) {
  const t = useTranslations("finance.dashboard.kpi");
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      {kpis.map((kpi) => (
        <Card key={kpi.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground truncate text-sm font-medium">
              {t(kpi.key)}
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <p className="text-xl font-bold tracking-tight whitespace-nowrap tabular-nums xl:text-2xl">
              {kpi.key === "count" ? formatDisplayNumber(kpi.value) : formatDisplayMoney(kpi.value)}
            </p>
            <p
              className={
                kpi.change === null
                  ? "text-muted-foreground text-xs"
                  : kpi.change >= 0
                    ? "text-success text-xs"
                    : "text-destructive text-xs"
              }
            >
              {kpi.change === null ? t("noPrevious") : t("change", { percent: kpi.change })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
