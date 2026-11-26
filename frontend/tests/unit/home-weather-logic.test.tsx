// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_TIMEZONE } from "@/shares/constants/locale";
import { WeatherWidget } from "@/modules/home/components/landing/weather-widget";
import {
  WEATHER_CACHE_STORAGE_KEY,
  WEATHER_CACHE_TTL_MS,
} from "@/modules/home/constants/weather-config";
import {
  getTimezoneClockMinutes,
  isDaytimeBySchedule,
  parseClockMinutes,
} from "@/modules/home/lib/weather-detection";
import { useWeatherStore } from "@/modules/home/store/weather-store";

vi.mock("next-intl", () => ({
  useLocale: () => "vi",
  useTranslations: () => (key: string) => key,
}));

describe("Logic thời tiết, bình minh & hoàng hôn trang Home", () => {
  beforeEach(() => {
    localStorage.clear();
    useWeatherStore.getState().clearCache();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("parseClockMinutes hỗ trợ cả HH:mm lẫn chuỗi ISO của Open-Meteo", () => {
    expect(parseClockMinutes("05:55")).toBe(5 * 60 + 55);
    expect(parseClockMinutes("17:12")).toBe(17 * 60 + 12);
    expect(parseClockMinutes("2026-11-25T17:12")).toBe(17 * 60 + 12);
    expect(parseClockMinutes("")).toBeNull();
    expect(parseClockMinutes("99:00")).toBeNull();
  });

  it("isDaytimeBySchedule xác định đúng ban ngày / ban đêm theo giờ Việt Nam", () => {
    const noonVn = new Date("2026-11-25T05:00:00Z"); // 12:00 Asia/Ho_Chi_Minh
    const duskVn = new Date("2026-11-25T10:12:00Z"); // 17:12 Asia/Ho_Chi_Minh
    const nightVn = new Date("2026-11-25T12:30:00Z"); // 19:30 Asia/Ho_Chi_Minh

    expect(Math.floor(getTimezoneClockMinutes(DEFAULT_TIMEZONE, noonVn))).toBe(12 * 60);
    expect(isDaytimeBySchedule("05:55", "17:12", noonVn)).toBe(true);
    expect(isDaytimeBySchedule("05:55", "17:12", duskVn)).toBe(false);
    expect(isDaytimeBySchedule("05:55", "17:12", nightVn)).toBe(false);
  });

  it("giữ hiệu ứng mưa vào ban đêm và hiển thị giờ bình minh / hoàng hôn từ Open-Meteo", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 23.4,
          apparent_temperature: 25.1,
          relative_humidity_2m: 90,
          is_day: 0,
          precipitation: 0.4,
          weather_code: 53,
          cloud_cover: 80,
          surface_pressure: 1012,
          wind_speed_10m: 9,
          wind_gusts_10m: 14,
        },
        daily: {
          sunrise: ["2026-11-25T05:55"],
          sunset: ["2026-11-25T17:12"],
        },
      }),
    } as Response);

    const onWeatherChange = vi.fn();
    render(<WeatherWidget onWeatherChange={onWeatherChange} isDay={false} />);

    await waitFor(() => {
      expect(screen.getByText("05:55")).toBeTruthy();
      expect(screen.getByText("17:12")).toBeTruthy();
    });

    await waitFor(() => {
      expect(onWeatherChange).toHaveBeenCalledWith(
        expect.objectContaining({
          effect: "rain",
          isDay: false,
          suggestedTrack: "rain",
          sunrise: "05:55",
          sunset: "17:12",
        }),
      );
    });
  });

  it("persist cache 15 phút vào localStorage, đọc lại khi F5 và vẫn cho phép bấm nút làm mới", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 29,
          apparent_temperature: 32,
          relative_humidity_2m: 72,
          is_day: 1,
          precipitation: 0,
          weather_code: 1,
          cloud_cover: 20,
          surface_pressure: 1014,
          wind_speed_10m: 11,
          wind_gusts_10m: 18,
        },
        daily: {
          sunrise: ["2026-11-26T05:51"],
          sunset: ["2026-11-26T17:18"],
        },
      }),
    } as Response);

    const onWeatherChange = vi.fn();
    const view1 = render(<WeatherWidget onWeatherChange={onWeatherChange} isDay />);
    await waitFor(() => {
      expect(screen.getByText("05:51")).toBeTruthy();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const rawStored = localStorage.getItem(WEATHER_CACHE_STORAGE_KEY);
    expect(rawStored).toBeTruthy();
    expect(rawStored).toContain("queryKey");
    expect(rawStored).not.toMatch(/token|secret|password/i);

    // Mô phỏng F5 reload (xóa store in-memory nhưng giữ nguyên localStorage đã persist)
    view1.unmount();
    useWeatherStore.setState({ cache: {} });
    if (rawStored) localStorage.setItem(WEATHER_CACHE_STORAGE_KEY, rawStored);

    render(<WeatherWidget onWeatherChange={onWeatherChange} isDay />);
    await waitFor(() => {
      expect(screen.getByText("05:51")).toBeTruthy();
    });
    // Dùng lại cache từ localStorage -> 0 lượt fetch thêm!
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Bấm nút làm mới thủ công -> bỏ qua cache, gọi fetch mới
    const reloadButton = screen.getByTitle("weather.reload");
    fireEvent.click(reloadButton);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    // Giả lập cache quá hạn 15 phút -> tự gọi fetch lại khi re-mount
    const storedObj = JSON.parse(localStorage.getItem(WEATHER_CACHE_STORAGE_KEY) ?? "{}") as {
      state?: { cache?: Record<string, { timestamp?: number }> };
    };
    if (storedObj.state?.cache?.danang) {
      storedObj.state.cache.danang.timestamp = Date.now() - WEATHER_CACHE_TTL_MS - 1000;
      localStorage.setItem(WEATHER_CACHE_STORAGE_KEY, JSON.stringify(storedObj));
    }
    cleanup();
    useWeatherStore.setState({ cache: {} });
    render(<WeatherWidget onWeatherChange={onWeatherChange} isDay />);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});
