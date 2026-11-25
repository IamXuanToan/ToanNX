"use client";

import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

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

import { chartColor } from "../../constants/chart-colors";

/** @param props - Nền tảng + 12 dòng VNĐ theo nền tảng; nhãn tháng. @returns Vùng chồng theo nền tảng. */
export function FinancePlatformAreaChart({
  platforms,
  rows,
  monthLabel,
}: {
  platforms: string[];
  rows: Record<string, number>[];
  monthLabel: (month: number) => string;
}) {
  const t = useTranslations("finance.dashboard");
  const locale = useLocale();
  const numberLocale = getNumberLocale(locale);
  const keys = platforms.map((_, index) => `p${index}`);
  const config = Object.fromEntries(
    platforms.map((name, index) => [keys[index], { label: name, color: chartColor(index) }]),
  ) satisfies ChartConfig;
  const data = rows.map((row) => ({
    label: monthLabel(row.month),
    ...Object.fromEntries(platforms.map((name, index) => [keys[index], row[name] ?? 0])),
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("charts.platforms")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <AreaChart data={data} margin={{ left: 8, right: 8 }}>
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
            {keys.map((key) => (
              <Area
                key={key}
                dataKey={key}
                stackId="platforms"
                type="monotone"
                stroke={`var(--color-${key})`}
                fill={`var(--color-${key})`}
                fillOpacity={0.35}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
