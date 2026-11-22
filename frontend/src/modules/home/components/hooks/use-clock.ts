"use client";

import { useSyncExternalStore } from "react";

import type { ClockSnapshot } from "../../types/clock.types";

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
