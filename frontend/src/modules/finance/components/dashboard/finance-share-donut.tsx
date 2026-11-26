"use client";

import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/shares/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shares/components/ui/chart";

import { platformChartConfigItem } from "../../constants/chart-colors";

/** @param props - Tiêu đề + phần (VNĐ, kèm màu cấu hình nếu có). @returns Donut tỷ trọng. */
export function FinanceShareDonut({
  title,
  items,
}: {
  title: string;
  items: { name: string; value: number; color?: string }[];
}) {
  const t = useTranslations("finance.dashboard");
  const config = Object.fromEntries(
    items.map((item, index) => [
      `s${index}`,
      platformChartConfigItem(item.name, item.color, index),
    ]),
  ) satisfies ChartConfig;
  const data = items.map((item, index) => ({
    key: `s${index}`,
    name: item.name,
    value: item.value,
  }));
  const hasData = data.some((item) => item.value > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-muted-foreground flex h-72 items-center justify-center text-center text-xs">
            {t("charts.empty")}
          </div>
        ) : (
          <ChartContainer config={config} className="h-72 w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="key"
                innerRadius="55%"
                outerRadius="85%"
                strokeWidth={2}
              >
                {data.map((item) => (
                  <Cell key={item.key} fill={`var(--color-${item.key})`} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="key" />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
