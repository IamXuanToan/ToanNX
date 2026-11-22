"use client";

import { useTranslations } from "next-intl";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

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

import type { MonthPoint } from "../../lib/report-series";

/** @param props - Dữ liệu 12 tháng. @returns Số giao dịch (cột) + trung bình mỗi giao dịch (đường). */
export function FinanceCountChart({ points }: { points: MonthPoint[] }) {
  const t = useTranslations("finance.dashboard");
  const config = {
    count: { label: t("kpi.count"), color: "var(--chart-4)" },
    average: { label: t("average"), color: "var(--chart-1)" },
  } satisfies ChartConfig;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("charts.count")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <ComposedChart data={points} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              yAxisId="count"
              tickLine={false}
              axisLine={false}
              width={32}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="average"
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(value: number) =>
                formatDisplayNumber(value, { maximumFractionDigits: 0 })
              }
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar yAxisId="count" dataKey="count" fill="var(--color-count)" radius={4} />
            <Line
              yAxisId="average"
              dataKey="average"
              stroke="var(--color-average)"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
