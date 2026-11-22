"use client";

import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/shares/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shares/components/ui/chart";

import type { MonthPoint } from "../../lib/report-series";

/** @param props - Dữ liệu 12 tháng. @returns % tăng/giảm tổng thu nhập so với tháng trước (xanh tăng, đỏ giảm). */
export function FinanceGrowthChart({ points }: { points: MonthPoint[] }) {
  const t = useTranslations("finance.dashboard");
  const config = { growth: { label: t("growth"), color: "var(--chart-2)" } } satisfies ChartConfig;
  const data = points.map((point) => ({ label: point.label, growth: point.growth ?? 0 }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("charts.growth")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <BarChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(value: number) => `${value}%`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="growth" radius={4}>
              {data.map((item) => (
                <Cell
                  key={item.label}
                  fill={item.growth >= 0 ? "var(--success)" : "var(--destructive)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
