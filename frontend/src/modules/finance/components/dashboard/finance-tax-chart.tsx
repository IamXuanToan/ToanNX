"use client";

import { useLocale, useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/shares/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shares/components/ui/chart";
import { formatCompactDisplayNumber, getNumberLocale } from "@/shares/lib/number-format";

import type { MonthPoint } from "../../lib/report-series";

/** @param props - Dữ liệu 12 tháng. @returns Tiền thuế bị khấu trừ theo tháng. */
export function FinanceTaxChart({ points }: { points: MonthPoint[] }) {
  const t = useTranslations("finance.dashboard");
  const locale = useLocale();
  const numberLocale = getNumberLocale(locale);
  const config = { tax: { label: t("kpi.tax"), color: "var(--chart-5)" } } satisfies ChartConfig;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("charts.tax")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <BarChart data={points} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) => formatCompactDisplayNumber(value, numberLocale)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="tax" fill="var(--color-tax)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
