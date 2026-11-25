"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { ShortLink } from "@/modules/utilities/types/short-link.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shares/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shares/components/ui/chart";
import { Skeleton } from "@/shares/components/ui/skeleton";

export type PortalLinkClicksChartProps = {
  links?: ShortLink[];
  isLoading?: boolean;
};

/**
 * Biểu đồ cột so sánh lượt click giữa các link rút gọn của người dùng.
 *
 * @param props - Danh sách link rút gọn.
 * @returns Thẻ biểu đồ cột click link.
 */
export function PortalLinkClicksChart({ links = [], isLoading }: PortalLinkClicksChartProps) {
  const t = useTranslations("portal.dashboard");

  const chartConfig = {
    clicksCount: {
      label: t("charts.clicks"),
      color: "var(--color-chart-3)",
    },
  } satisfies ChartConfig;

  // Lấy top 5 link có nhiều click nhất
  const chartData = useMemo(() => {
    return [...links]
      .sort((a, b) => (b.clicksCount ?? 0) - (a.clicksCount ?? 0))
      .slice(0, 6)
      .map((item) => ({
        name: item.name || item.slug,
        slug: item.slug,
        clicksCount: item.clicksCount ?? 0,
      }));
  }, [links]);

  const hasData = chartData.some((item) => item.clicksCount > 0);

  return (
    <Card className="border-border bg-card rounded-2xl shadow-2xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground text-sm font-bold">
          {t("charts.linkClicksTitle")}
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-xs">
          {t("charts.linkClicksDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : !hasData ? (
          <div className="text-muted-foreground flex h-64 flex-col items-center justify-center text-center text-xs">
            <p>{t("charts.noLinksData")}</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <BarChart data={chartData} margin={{ left: 8, right: 8, top: 12, bottom: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(val: string) => (val.length > 12 ? `${val.slice(0, 10)}…` : val)}
              />
              <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(val, _name, item) => (
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-muted-foreground">/{item.payload?.slug}:</span>
                        <span className="text-foreground font-bold">
                          {Number(val).toLocaleString("vi-VN")} click
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="clicksCount"
                fill="var(--color-chart-3)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
