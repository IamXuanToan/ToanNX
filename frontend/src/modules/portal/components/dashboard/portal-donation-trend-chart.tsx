"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { DonationDailyTrend } from "@/modules/utilities/types/donation.types";
import { Button } from "@/shares/components/ui/button";
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shares/components/ui/chart";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { formatVndText } from "@/shares/lib/number-format";

export type PortalDonationTrendChartProps = {
  data?: DonationDailyTrend[];
  isLoading?: boolean;
};

/**
 * Biểu đồ miền thể hiện xu hướng quyên góp & số lượt ủng hộ theo thời gian.
 *
 * @param props - Dữ liệu chuỗi thời gian quyên góp.
 * @returns Thẻ biểu đồ xu hướng.
 */
export function PortalDonationTrendChart({ data = [], isLoading }: PortalDonationTrendChartProps) {
  const t = useTranslations("portal.dashboard");
  const [viewMode, setViewMode] = useState<"both" | "amount" | "count">("both");

  const chartConfig = {
    amount: {
      label: t("charts.amount"),
      color: "var(--color-chart-1)",
    },
    count: {
      label: t("charts.count"),
      color: "var(--color-chart-2)",
    },
  } satisfies ChartConfig;

  // Định dạng ngày hiển thị dd/MM
  const formattedData = useMemo(() => {
    return data.map((item) => {
      let label = item.date;
      if (item.date) {
        const parts = item.date.split("-");
        if (parts.length === 3) {
          label = `${parts[2]}/${parts[1]}`;
        }
      }
      return {
        ...item,
        label,
      };
    });
  }, [data]);

  return (
    <Card className="border-border bg-card rounded-2xl shadow-2xs">
      <CardHeader className="flex flex-wrap items-start justify-between gap-2.5 pb-3">
        <div className="min-w-44 flex-1">
          <CardTitle className="text-foreground text-sm font-bold">
            {t("charts.donationTrendTitle")}
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-xs">
            {t("charts.donationTrendDesc")}
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant={viewMode === "both" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("both")}
            className="h-7 px-2 text-[11px]"
          >
            {t("charts.filterAll")}
          </Button>
          <Button
            type="button"
            variant={viewMode === "amount" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("amount")}
            className="h-7 px-2 text-[11px]"
          >
            {t("charts.filterAmount")}
          </Button>
          <Button
            type="button"
            variant={viewMode === "count" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("count")}
            className="h-7 px-2 text-[11px]"
          >
            {t("charts.filterCount")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : formattedData.length === 0 ? (
          <div className="text-muted-foreground flex h-64 flex-col items-center justify-center text-center text-xs">
            <p>{t("charts.noTrendData")}</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <AreaChart data={formattedData} margin={{ left: 8, right: 8, top: 12, bottom: 4 }}>
              <defs>
                <linearGradient id="donationAmountGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="donationCountGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              {(viewMode === "both" || viewMode === "amount") && (
                <YAxis
                  yAxisId="amount"
                  orientation="left"
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={(val: number) =>
                    val >= 1000000
                      ? `${(val / 1000000).toFixed(1)}M`
                      : val >= 1000
                        ? `${(val / 1000).toFixed(0)}k`
                        : `${val}`
                  }
                />
              )}
              {(viewMode === "both" || viewMode === "count") && (
                <YAxis
                  yAxisId="count"
                  orientation={viewMode === "both" ? "right" : "left"}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tickFormatter={(val: number) => `${val}`}
                />
              )}
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(val, name) => {
                      if (name === "amount") {
                        return (
                          <div className="flex w-full items-center justify-between gap-2">
                            <span className="text-muted-foreground">{t("charts.amount")}:</span>
                            <span className="text-foreground font-bold">{formatVndText(val)}</span>
                          </div>
                        );
                      }
                      return (
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="text-muted-foreground">{t("charts.count")}:</span>
                          <span className="text-foreground font-bold">{val}</span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              {(viewMode === "both" || viewMode === "amount") && (
                <Area
                  yAxisId="amount"
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="url(#donationAmountGrad)"
                />
              )}
              {(viewMode === "both" || viewMode === "count") && (
                <Area
                  yAxisId="count"
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  fill="url(#donationCountGrad)"
                />
              )}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
