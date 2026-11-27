"use client";

import { CalendarRange } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { DonationTable } from "@/modules/utilities/components/donation/donation-table";
import { DONATION_PERMISSIONS } from "@/modules/utilities/permissions/donation-permission";
import { DatePicker } from "@/shares/components/common/date-picker";
import { PageHeader } from "@/shares/components/common/page-header";
import { Button } from "@/shares/components/ui/button";

/**
 * Màn hình Lịch sử & Quản lý giao dịch Ủng hộ (Client Portal):
 * Bộ lọc khoảng ngày + bảng danh sách giao dịch cá nhân (hỗ trợ ẩn/hiện bình luận & xuất CSV).
 */
export function PortalDonationDashboard() {
  const t = useTranslations("portal.donations");
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

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

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

      <DonationTable
        ownerId={userId}
        canUpdate={canUpdate}
        dateFrom={dateFilter.date_from}
        dateTo={dateFilter.date_to}
      />
    </div>
  );
}
