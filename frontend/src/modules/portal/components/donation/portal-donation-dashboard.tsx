"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarRange, Coins, Heart, HeartHandshake, Trophy } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { DonationTable } from "@/modules/utilities/components/donation/donation-table";
import { donationKeys } from "@/modules/utilities/constants/query-keys";
import { DONATION_PERMISSIONS } from "@/modules/utilities/permissions/donation-permission";
import { donationService } from "@/modules/utilities/services/donation.service";
import { DatePicker } from "@/shares/components/common/date-picker";
import { Button } from "@/shares/components/ui/button";
import { Card, CardContent } from "@/shares/components/ui/card";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { CURRENCY_SYMBOLS } from "@/shares/constants/currency";

import { PortalDonationTrendChart } from "../dashboard/portal-donation-trend-chart";
import { PortalDonationGiftChart } from "./portal-donation-gift-chart";

/**
 * Màn hình Thống kê Quyên góp cá nhân trong Client Portal:
 * Chỉ hiển thị số liệu và giao dịch của riêng 1 người dùng (owner = current user).
 */
export function PortalDonationDashboard() {
  const t = useTranslations("portal.donations");
  const format = useFormatter();
  const searchParams = useSearchParams();
  const { data: currentUser } = useCurrentUser();
  const canUpdate = usePermission(DONATION_PERMISSIONS.update);
  const userId = currentUser?.user.id;

  const urlRange =
    (searchParams.get("range") as "all" | "today" | "7d" | "30d" | "custom") || "all";
  const urlFrom = searchParams.get("from") || "";
  const urlTo = searchParams.get("to") || "";

  const [dateRange, setDateRangeState] = useState<"all" | "today" | "7d" | "30d" | "custom">(
    urlRange,
  );
  const [customFrom, setCustomFromState] = useState<string>(urlFrom);
  const [customTo, setCustomToState] = useState<string>(urlTo);

  const updateUrlParams = (range: string, from?: string, to?: string) => {
    const params = new URLSearchParams(window.location.search);
    if (range && range !== "all") params.set("range", range);
    else params.delete("range");

    if (from) params.set("from", from);
    else params.delete("from");

    if (to) params.set("to", to);
    else params.delete("to");

    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  const setDateRange = (range: "all" | "today" | "7d" | "30d" | "custom") => {
    setDateRangeState(range);
    updateUrlParams(
      range,
      range === "custom" ? customFrom : undefined,
      range === "custom" ? customTo : undefined,
    );
  };

  const setCustomFrom = (val: string) => {
    setCustomFromState(val);
    updateUrlParams("custom", val, customTo);
  };

  const setCustomTo = (val: string) => {
    setCustomToState(val);
    updateUrlParams("custom", customFrom, val);
  };

  const getDateFilter = () => {
    const now = new Date();
    if (dateRange === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return {
        date_from: startOfDay.toISOString(),
        date_to: endOfDay.toISOString(),
      };
    }
    if (dateRange === "7d") {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { date_from: past.toISOString() };
    }
    if (dateRange === "30d") {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { date_from: past.toISOString() };
    }
    if (dateRange === "custom") {
      const filter: { date_from?: string; date_to?: string } = {};
      if (customFrom) {
        filter.date_from = new Date(`${customFrom}T00:00:00`).toISOString();
      }
      if (customTo) {
        filter.date_to = new Date(`${customTo}T23:59:59.999`).toISOString();
      }
      return filter;
    }
    return {};
  };

  const dateFilter = getDateFilter();

  const statsQuery = useQuery({
    queryKey: donationKeys.stats({ ...dateFilter, owner: userId }),
    queryFn: ({ signal }) => donationService.stats({ ...dateFilter, owner: userId }, signal),
    enabled: Boolean(userId),
  });

  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      {/* Banner chào mừng */}
      <div className="border-border from-primary/10 via-card to-card relative overflow-hidden rounded-2xl border bg-gradient-to-r p-6 shadow-2xs sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
            <Heart className="size-3.5 fill-current" />
            <span>{t("badge")}</span>
          </div>
          <h1 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
      </div>

      {/* KPI Cards cá nhân */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* 1. Tổng tiền cá nhân */}
        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Coins className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground truncate text-xs font-medium">
                {t("totalReceivedLabel")}
              </p>
              <h3 className="text-foreground text-xl font-extrabold sm:text-2xl">
                {stats ? (
                  `${format.number(stats.totalAmount)} ${CURRENCY_SYMBOLS.VND}`
                ) : (
                  <Skeleton className="h-7 w-24" />
                )}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                {t("totalReceivedHint", { count: stats?.totalCount ?? 0 })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Lượt ủng hộ */}
        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
              <HeartHandshake className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground truncate text-xs font-medium">
                {t("successCountLabel")}
              </p>
              <h3 className="text-foreground text-xl font-extrabold sm:text-2xl">
                {stats ? stats.totalCount : <Skeleton className="h-7 w-16" />}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                {t("hiddenCommentsHint", { count: stats?.hiddenCount ?? 0 })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Bảng vinh danh đang hoạt động */}
        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
              <Trophy className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground truncate text-xs font-medium">
                {t("activeLeaderboardLabel")}
              </p>
              <h3 className="text-foreground text-xl font-extrabold sm:text-2xl">
                {stats ? (
                  Object.values(stats.activeTierCounts ?? {}).reduce((a, b) => a + b, 0)
                ) : (
                  <Skeleton className="h-7 w-16" />
                )}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                {t("activeLeaderboardHint")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bộ lọc khoảng ngày nhanh & tùy chọn */}
      <div className="space-y-3 border-b pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground mr-1 text-xs font-medium">
            {t("dateRangeLabel")}
          </span>
          <Button
            type="button"
            variant={dateRange === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("all")}
            className="h-7 px-2.5 text-xs font-normal"
          >
            {t("rangeAll")}
          </Button>
          <Button
            type="button"
            variant={dateRange === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("today")}
            className="h-7 px-2.5 text-xs font-normal"
          >
            {t("rangeToday")}
          </Button>
          <Button
            type="button"
            variant={dateRange === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("7d")}
            className="h-7 px-2.5 text-xs font-normal"
          >
            {t("range7d")}
          </Button>
          <Button
            type="button"
            variant={dateRange === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("30d")}
            className="h-7 px-2.5 text-xs font-normal"
          >
            {t("range30d")}
          </Button>
          <Button
            type="button"
            variant={dateRange === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("custom")}
            className="h-7 gap-1 px-2.5 text-xs font-normal"
          >
            <CalendarRange className="size-3" />
            <span>{t("rangeCustom")}</span>
          </Button>
        </div>

        {/* Khối chọn ngày tùy biến */}
        {dateRange === "custom" && (
          <div className="animate-in fade-in-50 flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">{t("fromDateLabel")}</span>
              <DatePicker
                value={customFrom}
                onChange={setCustomFrom}
                placeholder={t("fromDatePlaceholder")}
                className="h-8 w-36 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">{t("toDateLabel")}</span>
              <DatePicker
                value={customTo}
                onChange={setCustomTo}
                placeholder={t("toDatePlaceholder")}
                className="h-8 w-36 text-xs"
              />
            </div>
            {(customFrom || customTo) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCustomFromState("");
                  setCustomToState("");
                  setDateRangeState("all");
                  updateUrlParams("all");
                }}
                className="text-muted-foreground hover:text-foreground h-8 px-2 text-xs"
              >
                {t("resetRange")}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Biểu đồ phân tích Quyên góp */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PortalDonationTrendChart data={stats?.dailyTrend} isLoading={statsQuery.isLoading} />
        <PortalDonationGiftChart byGift={stats?.byGift} isLoading={statsQuery.isLoading} />
      </div>

      {/* Bảng danh sách ủng hộ của cá nhân (hỗ trợ toggle ẩn/hiện comment và đồng bộ khoảng thời gian) */}
      <DonationTable
        ownerId={userId}
        canUpdate={canUpdate}
        dateFrom={dateFilter.date_from}
        dateTo={dateFilter.date_to}
      />
    </div>
  );
}
