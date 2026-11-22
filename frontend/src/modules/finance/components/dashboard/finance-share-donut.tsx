"use client";

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

import { chartColor } from "../../constants/chart-colors";

/** @param props - Tiêu đề + phần (VNĐ). @returns Donut tỷ trọng. */
export function FinanceShareDonut({
  title,
  items,
}: {
  title: string;
  items: { name: string; value: number }[];
}) {
  const config = Object.fromEntries(
    items.map((item, index) => [`s${index}`, { label: item.name, color: chartColor(index) }]),
  ) satisfies ChartConfig;
  const data = items.map((item, index) => ({
    key: `s${index}`,
    name: item.name,
    value: item.value,
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square h-64">
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
      </CardContent>
    </Card>
  );
}
