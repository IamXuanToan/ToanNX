import type { RainIntensityType } from "../components/landing/weather-canvas";

export type WeatherConditionKey = "clear" | "cloudy" | "fog" | "rain" | "storm";

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
