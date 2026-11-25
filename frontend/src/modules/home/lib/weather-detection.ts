import { DEFAULT_TIMEZONE } from "@/shares/constants/locale";

import type { RainIntensityType } from "../components/landing/weather-canvas";

export type WeatherConditionKey = "clear" | "cloudy" | "fog" | "rain" | "storm";

const MINUTES_PER_DAY = 24 * 60;
const DEFAULT_SUNRISE_MINUTES = 5 * 60 + 50;
const DEFAULT_SUNSET_MINUTES = 17 * 60 + 15;

const WMO_STORM_CODES = new Set([95, 96, 99]);
const WMO_HEAVY_RAIN_CODES = new Set([65, 67, 82, 95, 96, 99]);
const WMO_LIGHT_RAIN_CODES = new Set([51, 53, 56, 61, 80]);
const WMO_PRECIPITATION_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
]);

/**
 * Phân tích dữ liệu khí tượng Open-Meteo theo bảng chuẩn WMO (World Meteorological Organization)
 * để phát hiện chính xác trạng thái thời tiết và dông bão.
 */
export function detectWeatherCondition(
  code: number,
  windGusts: number,
  windSpeed: number,
  pressure: number,
  precipitation: number,
): WeatherConditionKey {
  if (WMO_STORM_CODES.has(code)) return "storm";
  if (windGusts >= 48 || windSpeed >= 35 || (pressure < 1002 && precipitation > 2)) {
    return "storm";
  }
  if (code === 45 || code === 48) return "fog";
  if (WMO_PRECIPITATION_CODES.has(code) || precipitation > 0.3) {
    return "rain";
  }
  if (code === 2 || code === 3) return "cloudy";
  return "clear";
}

/**
 * Tự động phân cấp mức độ mưa theo lượng mưa và mã WMO.
 */
export function detectRainIntensity(
  code: number,
  precipitation: number,
  condKey: WeatherConditionKey,
): RainIntensityType {
  if (condKey === "storm" || WMO_HEAVY_RAIN_CODES.has(code) || precipitation >= 4.0) {
    return "heavy";
  }
  if (WMO_LIGHT_RAIN_CODES.has(code) || precipitation < 1.5) {
    return "light";
  }
  return "medium";
}

/**
 * Chuyển chuỗi giờ `"HH:mm"` hoặc ISO `"YYYY-MM-DDTHH:mm"` thành tổng số phút tính từ `00:00`.
 *
 * @param value - Chuỗi giờ từ Open-Meteo (`"17:12"` hoặc `"2026-11-25T17:12"`).
 * @returns Số phút trong ngày `[0, 1439]`, hoặc `null` nếu không hợp lệ.
 */
export function parseClockMinutes(value?: string | null): number | null {
  if (!value) return null;
  const clockPart = value.includes("T") ? value.split("T")[1] : value;
  if (!clockPart) return null;
  const [hourStr, minuteStr] = clockPart.split(":");
  const hours = Number(hourStr);
  const minutes = Number(minuteStr);
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

/**
 * Lấy số phút hiện tại trong ngày theo đúng múi giờ cấu hình (`DEFAULT_TIMEZONE`),
 * bảo đảm quỹ đạo mặt trời/mặt trăng khớp với Open-Meteo ngay cả khi máy khách ở múi giờ khác.
 *
 * @param timeZone - Tên múi giờ IANA.
 * @param date - Thời điểm cần quy đổi.
 * @returns Số phút (có phần lẻ giây) trong `[0, 1440)`.
 */
export function getTimezoneClockMinutes(
  timeZone: string = DEFAULT_TIMEZONE,
  date: Date = new Date(),
): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const hour = read("hour") % 24;
  const minute = read("minute");
  const second = read("second");
  return (hour * 60 + minute + second / 60) % MINUTES_PER_DAY;
}

/**
 * Xác định đang là ban ngày hay ban đêm dựa theo giờ mặt trời mọc/lặn tại `timeZone`.
 *
 * @param sunrise - Giờ bình minh (`"05:55"` hoặc ISO).
 * @param sunset - Giờ hoàng hôn (`"17:12"` hoặc ISO).
 * @param date - Thời điểm kiểm tra.
 * @param timeZone - Múi giờ tham chiếu.
 * @returns `true` nếu thời điểm nằm trong `[sunrise, sunset)`.
 */
export function isDaytimeBySchedule(
  sunrise?: string | null,
  sunset?: string | null,
  date: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE,
): boolean {
  const sunriseMinutes = parseClockMinutes(sunrise) ?? DEFAULT_SUNRISE_MINUTES;
  const sunsetMinutes = parseClockMinutes(sunset) ?? DEFAULT_SUNSET_MINUTES;
  const currentMinutes = getTimezoneClockMinutes(timeZone, date);
  return currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes;
}
