"use client";

import { useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/shares/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shares/components/ui/chart";
import { formatDisplayNumber } from "@/shares/lib/number-format";

import type { MonthPoint } from "../lib/report-series";

/** @param props - Dữ liệu 12 tháng. @returns Đường lũy kế từ đầu năm (tổng, đã/chưa khấu trừ). */
export function FinanceCumulativeChart({ points }: { points: MonthPoint[] }) {
  const t = useTranslations("finance.dashboard");
  const config = {
    cumulativeTotal: { label: t("kpi.total"), color: "var(--chart-1)" },
    cumulativeWithheld: { label: t("kpi.withheld"), color: "var(--chart-2)" },
    cumulativeNotWithheld: { label: t("kpi.notWithheld"), color: "var(--chart-3)" },
  } satisfies ChartConfig;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("charts.cumulative")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <LineChart data={points} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(value: number) =>
                formatDisplayNumber(value, { maximumFractionDigits: 0 })
              }
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {Object.keys(config).map((key) => (
              <Line
                key={key}
                dataKey={key}
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
