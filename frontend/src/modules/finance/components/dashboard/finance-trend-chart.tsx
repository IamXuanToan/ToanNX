"use client";

import { useLocale, useTranslations } from "next-intl";
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
import { formatCompactDisplayNumber, getNumberLocale } from "@/shares/lib/number-format";

import type { MonthPoint } from "../../lib/report-series";

type Metric = "total" | "withheld" | "notWithheld";
const PREVIOUS: Record<Metric, keyof MonthPoint> = {
  total: "previousTotal",
  withheld: "previousWithheld",
  notWithheld: "previousNotWithheld",
};

/**
 * Biểu đồ đường theo tháng của một chỉ số (tổng / đã khấu trừ / chưa khấu trừ); nét đứt là năm trước.
 *
 * @param props - Chỉ số, màu, dữ liệu, bấm một tháng.
 * @returns Thẻ biểu đồ.
 */
export function FinanceTrendChart({
  metric,
  color,
  points,
  onMonthClick,
}: {
  metric: Metric;
  color: string;
  points: MonthPoint[];
  onMonthClick?: (month: number) => void;
}) {
  const t = useTranslations("finance.dashboard");
  const locale = useLocale();
  const numberLocale = getNumberLocale(locale);
  const config = {
    [metric]: { label: t(`kpi.${metric}`), color },
    [PREVIOUS[metric]]: { label: t("previousYear"), color: "var(--muted-foreground)" },
  } satisfies ChartConfig;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t(`charts.${metric}`)}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <LineChart
            data={points}
            margin={{ left: 8, right: 8 }}
            onClick={(event) => {
              const index = Number(event?.activeTooltipIndex);
              const point = Number.isInteger(index) ? points[index] : undefined;
              if (point) onMonthClick?.(point.month);
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) => formatCompactDisplayNumber(value, numberLocale)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey={metric}
              stroke={`var(--color-${metric})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              dataKey={PREVIOUS[metric]}
              stroke={`var(--color-${String(PREVIOUS[metric])})`}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
