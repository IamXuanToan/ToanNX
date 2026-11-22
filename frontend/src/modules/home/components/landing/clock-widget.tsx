"use client";

import { Calendar, Clock, Compass, Hourglass } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { useStoredPreference } from "@/shares/hooks/use-stored-preference";

import { useClock } from "./hooks/use-clock";

interface ClockWidgetProps {
  isDay?: boolean;
}

const FORMAT_STORAGE_KEY = "clock_format";

const isClockFormat = (value: unknown): value is "12h" | "24h" =>
  value === "12h" || value === "24h";

/**
 * Widget đồng hồ thời gian thực GMT+7 (Hồ Chí Minh / Việt Nam) - Thiết kế tinh giản, sang trọng:
 * - Hiển thị giờ phút giây nổi bật, ngày dương lịch và âm lịch Việt Nam liền mạch.
 * - Tích hợp nút chuyển đổi định dạng 12H / 24H ngay trên thanh header gọn gàng.
 * - Loại bỏ các bảng thống kê phức tạp, mang lại cảm giác thoáng đãng, tự nhiên, dễ nhìn.
 */
export function ClockWidget({ isDay = true }: ClockWidgetProps) {
  const t = useTranslations("common.home");
  const locale = useLocale();
  const clock = useClock();
  const [timeFormat, setTimeFormat] = useStoredPreference<"12h" | "24h">(
    FORMAT_STORAGE_KEY,
    "12h",
    isClockFormat,
  );

  const toggleFormat = () => {
    setTimeFormat(timeFormat === "12h" ? "24h" : "12h");
  };

  const is12h = timeFormat === "12h";
  const displayHours = is12h ? clock.hours12 : clock.hours24;
  const dateString = locale === "vi" ? clock.dateStringVi : clock.dateStringEn;
  const lunarYear = locale === "vi" ? clock.lunarYearVi : clock.lunarYearEn;

  return (
    <div
      className={`flex w-full flex-col justify-between rounded-2xl border p-4 shadow-lg backdrop-blur-xl transition-all duration-700 sm:p-5 ${
        isDay
          ? "border-white/50 bg-white/40 text-slate-800 shadow-black/5"
          : "border-white/10 bg-black/40 text-slate-100 shadow-black/20"
      }`}
    >
      {/* 1. Header: Múi giờ & Chuyển đổi định dạng 12h / 24h & Trạng thái Live */}
      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
            isDay
              ? "border-white/50 bg-white/40 text-slate-700"
              : "border-white/10 bg-white/[0.06] text-slate-300"
          }`}
        >
          <Clock className={`size-3.5 ${isDay ? "text-sky-600" : "text-sky-400"}`} />
          <span>{t("timezoneLabel")}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleFormat}
            title={t("clock.toggleFormat")}
            className={`h-auto rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 ${
              isDay
                ? "border-white/50 bg-white/40 text-slate-700 hover:bg-white/70"
                : "border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]"
            }`}
          >
            {timeFormat.toUpperCase()}
          </Button>
          <Badge
            variant="outline"
            className={`text-[11px] font-medium ${
              isDay
                ? "border-white/50 bg-white/40 text-slate-700"
                : "border-white/10 bg-white/[0.05] text-slate-300"
            }`}
          >
            <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-emerald-500" />
            {t("clock.live")}
          </Badge>
        </div>
      </div>

      {/* 2. Hero: Giờ phút giây lớn & Ngày Dương / Âm lịch trực quan */}
      <div className="my-auto py-4">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-mono text-5xl font-black tracking-tight drop-shadow-sm sm:text-6xl ${
              isDay ? "text-slate-900" : "text-white"
            }`}
          >
            {displayHours}
          </span>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-xl font-bold text-sky-600 sm:text-2xl">:{clock.seconds}</span>
            {is12h && clock.period ? (
              <span
                className={`text-xs font-extrabold tracking-wider uppercase sm:text-sm ${
                  isDay ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {clock.period}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-2 space-y-0.5">
          <div
            className={`text-xs font-semibold capitalize sm:text-sm ${
              isDay ? "text-slate-800" : "text-slate-200"
            }`}
          >
            {dateString || t("clock.syncing")}
          </div>
          <div className={`text-xs font-medium ${isDay ? "text-slate-500" : "text-slate-400"}`}>
            {t("clock.lunarText", {
              date: clock.lunarDate,
              year: lunarYear || t("clock.lunarFallback"),
            })}
          </div>
        </div>
      </div>

      {/* 3. Dải thông tin phụ gọn gàng (Ngày trong năm, Tuần, Tiến độ ngày) */}
      <div
        className={`flex items-center justify-between border-t pt-3 text-[11px] sm:text-xs ${
          isDay ? "border-slate-900/10 text-slate-600" : "border-white/10 text-slate-300"
        }`}
      >
        <div
          title={t("clock.dayOfYearTooltip", { current: clock.dayOfYear, total: clock.totalDays })}
          className="flex shrink-0 items-center gap-1 whitespace-nowrap sm:gap-1.5"
        >
          <Calendar className="size-3 text-sky-500 sm:size-3.5" />
          <span>
            {t("clock.dayLabel")}:{" "}
            <strong className={isDay ? "text-slate-900" : "text-white"}>
              {clock.dayOfYear}/{clock.totalDays}
            </strong>
          </span>
        </div>

        <div
          title={t("clock.weekOfYearTooltip", { current: clock.weekOfYear, total: 52 })}
          className="flex shrink-0 items-center gap-1 whitespace-nowrap sm:gap-1.5"
        >
          <Compass className="size-3 text-teal-500 sm:size-3.5" />
          <span>
            {t("clock.weekLabel")}:{" "}
            <strong className={isDay ? "text-slate-900" : "text-white"}>
              {clock.weekOfYear}/52
            </strong>
          </span>
        </div>

        <div
          title={t("clock.yearProgressTooltip", {
            total: clock.totalDays,
            current: clock.dayOfYear,
          })}
          className="flex shrink-0 items-center gap-1 whitespace-nowrap sm:gap-1.5"
        >
          <Hourglass className="size-3 text-amber-500 sm:size-3.5" />
          <span>
            {t("clock.yearProgressLabel")}:{" "}
            <strong className={isDay ? "text-slate-900" : "text-white"}>
              {clock.yearProgress}%
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
