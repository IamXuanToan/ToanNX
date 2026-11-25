"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
import { formatVndText } from "@/shares/lib/number-format";

export type PortalDonationGiftChartProps = {
  byGift?: Array<{
    gift_type: string;
    gift_label: string;
    count: number;
    total: number;
  }>;
  isLoading?: boolean;
};

/**
 * Biểu đồ cơ cấu quà tặng quy đổi (Ly cà phê, Gói mì tôm, Bữa sáng...).
 *
 * @param props - Dữ liệu cơ cấu quà tặng.
 * @returns Thẻ biểu đồ cột quà tặng.
 */
export function PortalDonationGiftChart({ byGift = [], isLoading }: PortalDonationGiftChartProps) {
  const t = useTranslations("portal.dashboard");

  const chartConfig = {
    count: {
      label: t("charts.count"),
      color: "var(--color-chart-4)",
    },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    return byGift.map((item) => ({
      label: item.gift_label,
      count: item.count,
      total: item.total,
    }));
  }, [byGift]);

  return (
    <Card className="border-border bg-card rounded-2xl shadow-2xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground text-sm font-bold">
          {t("charts.giftBreakdownTitle")}
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-xs">
          {t("charts.giftBreakdownDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : chartData.length === 0 ? (
          <div className="text-muted-foreground flex h-64 flex-col items-center justify-center text-center text-xs">
            <p>{t("charts.noGiftsData")}</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 8, right: 16, top: 8, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                width={84}
                tickFormatter={(val: string) => (val.length > 11 ? `${val.slice(0, 10)}…` : val)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(val, _name, item) => (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">{t("charts.count")}:</span>
                          <span className="text-foreground font-bold">
                            {t("charts.giftCount", { count: Number(val) || 0 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-[11px]">
                          <span className="text-muted-foreground">{t("charts.amount")}:</span>
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            {formatVndText(item.payload?.total)}
                          </span>
                        </div>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="count"
                fill="var(--color-chart-4)"
                radius={[0, 6, 6, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
