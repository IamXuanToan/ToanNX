"use client";

import { Calendar, Clock, Compass, Hourglass } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { useStoredPreference } from "@/shares/hooks/use-stored-preference";

export interface ClockSnapshot {
  hours12: string;
  hours24: string;
  seconds: string;
  period: string;
  dateString: string;
  dateStringVi: string;
  dateStringEn: string;
  lunarDate: string;
  lunarYear: string;
  lunarYearVi: string;
  lunarYearEn: string;
  dayOfYear: number;
  totalDays: number;
  weekOfYear: number;
  dayProgress: number;
  yearProgress: number;
}

const SERVER_SNAPSHOT: ClockSnapshot = {
  hours12: "--:--",
  hours24: "--:--",
  seconds: "--",
  period: "--",
  dateString: "",
  dateStringVi: "",
  dateStringEn: "",
  lunarDate: "--/--",
  lunarYear: "",
  lunarYearVi: "",
  lunarYearEn: "",
  dayOfYear: 0,
  totalDays: 365,
  weekOfYear: 0,
  dayProgress: 0,
  yearProgress: 0,
};

const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"] as const;
const CHI = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
] as const;

function calculateClockSnapshot(now: Date): ClockSnapshot {
  // 1. Phân tách giờ 12h và 24h
  const parts12 = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).formatToParts(now);

  const parts24 = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  let h12 = "00";
  let m12 = "00";
  let s12 = "00";
  let p12 = "";
  for (const p of parts12) {
    if (p.type === "hour") h12 = p.value;
    if (p.type === "minute") m12 = p.value;
    if (p.type === "second") s12 = p.value;
    if (p.type === "dayPeriod") p12 = p.value;
  }

  let h24 = "00";
  let m24 = "00";
  for (const p of parts24) {
    if (p.type === "hour") h24 = p.value;
    if (p.type === "minute") m24 = p.value;
  }

  // 2. Ngày Dương lịch (hỗ trợ cả tiếng Việt và tiếng Anh)
  const dateStringVi = now.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dateStringEn = now.toLocaleDateString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 3. Âm lịch Việt Nam
  let lunarDate = "--/--";
  let lunarYearVi = "";
  let lunarYearEn = "";
  try {
    const lunarParts = new Intl.DateTimeFormat("vi-VN-u-ca-chinese", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(now);
    let lDay = "01";
    let lMonth = "01";
    let lYear = 2026;
    for (const p of lunarParts) {
      if (p.type === "day") lDay = p.value;
      if (p.type === "month") lMonth = p.value;
      if ((p.type as string) === "relatedYear" || p.type === "year") {
        lYear = parseInt(p.value, 10);
      }
    }
    const can = CAN[(lYear + 6) % 10];
    const chi = CHI[(lYear + 8) % 12];
    lunarDate = `${lDay}/${lMonth}`;
    lunarYearVi = `Năm ${can} ${chi}`;
    lunarYearEn = `Year of ${can} ${chi}`;
  } catch {
    lunarDate = "--/--";
    lunarYearVi = "Âm lịch";
    lunarYearEn = "Lunar Calendar";
  }

  // 4. Thống kê lịch: Ngày trong năm, Tuần trong năm, Tiến độ ngày %
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const diff = now.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay) + 1;
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const totalDays = isLeap ? 366 : 365;

  const target = new Date(now.valueOf());
  const dayNr = (now.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekOfYear = Math.max(1, 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000));

  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const dayProgress = Math.min(
    100,
    Math.max(0, Math.round(((h * 3600 + m * 60 + s) / 86400) * 100)),
  );
  const yearProgress = Math.min(100, Math.max(0, Math.round((dayOfYear / totalDays) * 100)));

  return {
    hours12: `${h12}:${m12}`,
    hours24: `${h24}:${m24}`,
    seconds: s12,
    period: p12,
    dateString: dateStringVi,
    dateStringVi,
    dateStringEn,
    lunarDate,
    lunarYear: lunarYearVi,
    lunarYearVi,
    lunarYearEn,
    dayOfYear,
    totalDays,
    weekOfYear,
    dayProgress,
    yearProgress,
  };
}

let currentClientSnapshot: ClockSnapshot = SERVER_SNAPSHOT;

function getClientSnapshot(): ClockSnapshot {
  return currentClientSnapshot;
}

function getServerSnapshot(): ClockSnapshot {
  return SERVER_SNAPSHOT;
}

function subscribe(callback: () => void) {
  const update = () => {
    currentClientSnapshot = calculateClockSnapshot(new Date());
    callback();
  };

  update();
  const id = setInterval(update, 1000);
  return () => clearInterval(id);
}

/**
 * Hook truy xuất thời gian thực GMT+7 (Hồ Chí Minh) an toàn với hydration React 19.
 */
export function useClock(): ClockSnapshot {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

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
      className={`flex w-full flex-col justify-between rounded-3xl border p-5 shadow-xl backdrop-blur-md transition-all duration-700 sm:p-6 ${
        isDay
          ? "border-white/40 bg-white/30 text-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
          : "border-white/10 bg-black/30 text-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
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
        className={`flex items-center justify-between border-t pt-3 text-xs ${
          isDay ? "border-slate-900/10 text-slate-600" : "border-white/10 text-slate-300"
        }`}
      >
        <div
          title={t("clock.dayOfYearTooltip", { current: clock.dayOfYear, total: clock.totalDays })}
          className="flex items-center gap-1.5"
        >
          <Calendar className="size-3.5 text-sky-500" />
          <span>
            {t("clock.dayLabel")}:{" "}
            <strong className={isDay ? "text-slate-900" : "text-white"}>
              {clock.dayOfYear}/{clock.totalDays}
            </strong>
          </span>
        </div>

        <div
          title={t("clock.weekOfYearTooltip", { current: clock.weekOfYear, total: 52 })}
          className="flex items-center gap-1.5"
        >
          <Compass className="size-3.5 text-teal-500" />
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
          className="flex items-center gap-1.5"
        >
          <Hourglass className="size-3.5 text-amber-500" />
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
