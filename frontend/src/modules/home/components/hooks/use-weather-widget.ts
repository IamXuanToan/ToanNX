"use client";

import { useEffect, useState } from "react";

import { useStoredPreference } from "@/shares/hooks/use-stored-preference";

import { calculateAstronomicalMoonPhase, type LocationKey, useWeatherStore, type WeatherData } from "../../store/weather-store";
import type { RainIntensityType, WeatherEffectType } from "../weather-canvas";

export interface WeatherInfo {
  effect: WeatherEffectType;
  temperature: number;
  isDay: boolean;
  windSpeed: number;
  rainIntensity: RainIntensityType;
  suggestedTrack: "lofi" | "rain" | "storm" | "ocean";
  sunrise?: string;
  sunset?: string;
  moonPhase?: number;
}

export interface UseWeatherWidgetProps {
  onWeatherChange: (info: WeatherInfo) => void;
  isDay?: boolean;
}

export const LOCATIONS: Record<LocationKey, { name: string; lat: number; lon: number }> = {
  danang: {
    name: "Đà Nẵng",
    lat: 16.0767,
    lon: 108.2228,
  },
  quangtri: {
    name: "Quảng Trị",
    lat: 17.4686,
    lon: 106.6223,
  },
};

const STORAGE_KEY = "home_location";

export const DEFAULT_FALLBACK: Record<LocationKey, WeatherData> = {
  danang: {
    temperature: 28,
    feelsLike: 31,
    humidity: 74,
    windSpeed: 12,
    windGusts: 20,
    surfacePressure: 1014,
    cloudCover: 25,
    visibility: 10000,
    precipitation: 0,
    isDay: true,
    weatherCode: 1,
    conditionKey: "clear",
    sunrise: "05:50",
    sunset: "17:15",
    moonPhase: calculateAstronomicalMoonPhase(),
  },
  quangtri: {
    temperature: 27,
    feelsLike: 30,
    humidity: 78,
    windSpeed: 10,
    windGusts: 18,
    surfacePressure: 1013,
    cloudCover: 55,
    visibility: 9000,
    precipitation: 0,
    isDay: true,
    weatherCode: 3,
    conditionKey: "cloudy",
    sunrise: "05:52",
    sunset: "17:16",
    moonPhase: calculateAstronomicalMoonPhase(),
  },
};

/**
 * Phân tích dữ liệu khí tượng Open-Meteo theo bảng chuẩn WMO (World Meteorological Organization)
 * để phát hiện chính xác trạng thái thời tiết & dông bão
 */
export function detectWeatherCondition(
  code: number,
  windGusts: number,
  windSpeed: number,
  pressure: number,
  precipitation: number,
): "clear" | "cloudy" | "fog" | "rain" | "storm" {
  if ([95, 96, 99].includes(code)) return "storm";
  if (windGusts >= 48 || windSpeed >= 35 || (pressure < 1002 && precipitation > 2)) {
    return "storm";
  }
  if (code === 45 || code === 48) return "fog";
  if (
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86].includes(code) ||
    precipitation > 0.3
  ) {
    return "rain";
  }
  if (code === 2 || code === 3) return "cloudy";
  return "clear";
}

/**
 * Tự động phân cấp mức độ mưa theo lượng mưa và mã WMO
 */
export function detectRainIntensity(
  code: number,
  precipitation: number,
  condKey: "clear" | "cloudy" | "fog" | "rain" | "storm",
): RainIntensityType {
  if (condKey === "storm" || [65, 67, 82, 95, 96, 99].includes(code) || precipitation >= 4.0) {
    return "heavy";
  }
  if ([51, 53, 56, 61, 80].includes(code) || precipitation < 1.5) {
    return "light";
  }
  return "medium";
}

const isLocationKey = (value: unknown): value is LocationKey =>
  value === "danang" || value === "quangtri";

/**
 * Hook quản lý trạng thái khí tượng, truy xuất API thời tiết Open-Meteo, lưu địa điểm và điều khiển hiệu ứng thời tiết.
 *
 * @param props - Thuộc tính `UseWeatherWidgetProps`.
 * @returns Toàn bộ dữ liệu khí tượng, trạng thái cập nhật, địa điểm và các hàm tương tác.
 */
export function useWeatherWidget({
  onWeatherChange,
  isDay: parentIsDay = true,
}: UseWeatherWidgetProps) {
  const [selectedLocation, setSelectedLocation] = useStoredPreference<LocationKey>(
    STORAGE_KEY,
    "danang",
    isLocationKey,
  );
  const [weatherData, setWeatherData] = useState<WeatherData>(DEFAULT_FALLBACK.danang);
  const [selectedEffect, setSelectedEffect] = useState<WeatherEffectType>("auto");
  const [rainIntensity, setRainIntensity] = useState<RainIntensityType>("medium");
  const [windMultiplier, setWindMultiplier] = useState<number>(1);
  const { isUpdating, setIsUpdating, getCachedWeather, setCachedWeather } = useWeatherStore();
  const [refreshTrigger, setRefreshTrigger] = useState<{ force: boolean; count: number }>({
    force: false,
    count: 0,
  });

  // Dọn dẹp key cache cũ trong LocalStorage nếu còn sót lại
  useEffect(() => {
    try {
      localStorage.removeItem("home_weather_cache_danang");
      localStorage.removeItem("home_weather_cache_quangtri");
    } catch {
      // bỏ qua
    }
  }, []);

  // Xác định trạng thái ngày/đêm hiệu lực: khi chọn "night", bắt buộc là ban đêm
  const effectiveIsDay =
    selectedEffect === "night" ? false : selectedEffect === "sunny" ? true : weatherData.isDay;

  // Sử dụng effectiveIsDay để widget phản ánh ngay trạng thái theme khi người dùng chọn hiệu ứng
  const isDay = parentIsDay && effectiveIsDay;

  // Fetch dữ liệu thời tiết chi tiết từ Open-Meteo API kèm cache LocalStorage 3 phút
  useEffect(() => {
    const loc = LOCATIONS[selectedLocation];
    let isCancelled = false;

    const loadWeather = async () => {
      if (!refreshTrigger.force) {
        const cached = getCachedWeather(selectedLocation);
        if (cached) {
          if (!isCancelled) {
            setWeatherData(cached);
            const intensity = detectRainIntensity(
              cached.weatherCode,
              cached.precipitation,
              cached.conditionKey,
            );
            setRainIntensity(intensity);
          }
          return;
        }
      }

      setIsUpdating(true);
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_gusts_10m&daily=sunrise,sunset&timezone=Asia%2FHo_Chi_Minh`,
        );

        if (!res.ok) throw new Error("Network error");
        const json = await res.json();
        const cur = json.current;
        const daily = json.daily;

        const wCode = cur.weather_code ?? 0;
        const wGusts = Math.round(cur.wind_gusts_10m ?? 15);
        const wSpeed = Math.round(cur.wind_speed_10m ?? 10);
        const sPressure = Math.round(cur.surface_pressure ?? 1013);
        const prec = cur.precipitation ?? 0;

        const condKey = detectWeatherCondition(wCode, wGusts, wSpeed, sPressure, prec);
        const calculatedRainIntensity = detectRainIntensity(wCode, prec, condKey);

        const sunriseStr = daily?.sunrise?.[0]?.split("T")[1] ?? "05:50";
        const sunsetStr = daily?.sunset?.[0]?.split("T")[1] ?? "17:15";

        const now = new Date();
        const moonPhaseVal = calculateAstronomicalMoonPhase(now);

        const parsedData: WeatherData = {
          temperature: Math.round(cur.temperature_2m ?? 28),
          feelsLike: Math.round(cur.apparent_temperature ?? 30),
          humidity: Math.round(cur.relative_humidity_2m ?? 70),
          windSpeed: wSpeed,
          windGusts: wGusts,
          surfacePressure: sPressure,
          cloudCover: Math.round(cur.cloud_cover ?? 30),
          visibility: 10000,
          precipitation: prec,
          isDay: cur.is_day === 1,
          weatherCode: wCode,
          conditionKey: condKey,
          sunrise: sunriseStr,
          sunset: sunsetStr,
          moonPhase: moonPhaseVal,
        };

        if (!isCancelled) {
          setWeatherData(parsedData);
          setRainIntensity(calculatedRainIntensity);
          setCachedWeather(selectedLocation, parsedData);
        }
      } catch {
        if (!isCancelled) {
          const fallback = DEFAULT_FALLBACK[selectedLocation];
          setWeatherData(fallback);
          setRainIntensity(
            detectRainIntensity(
              fallback.weatherCode,
              fallback.precipitation,
              fallback.conditionKey,
            ),
          );
        }
      } finally {
        if (!isCancelled) {
          setIsUpdating(false);
        }
      }
    };

    loadWeather();

    return () => {
      isCancelled = true;
    };
  }, [selectedLocation, refreshTrigger, getCachedWeather, setCachedWeather, setIsUpdating]);

  // Đồng bộ thời tiết & gợi ý bản nhạc tương thích lên component cha HomeHero
  useEffect(() => {
    let resolvedEffect: WeatherEffectType = selectedEffect;
    if (resolvedEffect === "auto") {
      if (!weatherData.isDay) {
        resolvedEffect = "night";
      } else if (weatherData.conditionKey === "storm") {
        resolvedEffect = "storm";
      } else if (weatherData.conditionKey === "rain") {
        resolvedEffect = "rain";
      } else if (weatherData.conditionKey === "fog") {
        resolvedEffect = "fog";
      } else {
        resolvedEffect = "sunny";
      }
    }

    const computedIsDay =
      resolvedEffect === "night" ? false : resolvedEffect === "sunny" ? true : weatherData.isDay;

    let suggestedTrack: "lofi" | "rain" | "storm" | "ocean" = "lofi";
    if (resolvedEffect === "storm") {
      suggestedTrack = "storm";
    } else if (resolvedEffect === "rain") {
      suggestedTrack = "rain";
    } else if (resolvedEffect === "night") {
      suggestedTrack = "ocean";
    } else if (resolvedEffect === "fog") {
      suggestedTrack = "ocean";
    } else {
      suggestedTrack = "lofi";
    }

    onWeatherChange({
      effect: resolvedEffect,
      temperature: weatherData.temperature,
      isDay: computedIsDay,
      windSpeed: Math.round(weatherData.windSpeed * windMultiplier),
      rainIntensity,
      suggestedTrack,
      sunrise: weatherData.sunrise,
      sunset: weatherData.sunset,
      moonPhase: weatherData.moonPhase,
    });
  }, [
    selectedEffect,
    weatherData.conditionKey,
    weatherData.temperature,
    weatherData.isDay,
    weatherData.windSpeed,
    weatherData.sunrise,
    weatherData.sunset,
    weatherData.moonPhase,
    windMultiplier,
    rainIntensity,
    onWeatherChange,
  ]);

  const handleLocationChange = (key: LocationKey) => {
    setSelectedLocation(key);
    setRefreshTrigger({ force: false, count: 0 });
  };

  const handleReload = () => {
    if (isUpdating) return;
    setRefreshTrigger((prev) => ({ force: true, count: prev.count + 1 }));
  };

  const isRainActive =
    selectedEffect === "rain" || (selectedEffect === "auto" && weatherData.conditionKey === "rain");

  const isStormActive =
    selectedEffect === "storm" ||
    (selectedEffect === "auto" && weatherData.conditionKey === "storm");

  const toggleWind = () => {
    setWindMultiplier((prev) => (prev >= 2 ? 1 : prev + 0.6));
  };

  return {
    selectedLocation,
    weatherData,
    selectedEffect,
    rainIntensity,
    windMultiplier,
    isUpdating,
    isDay,
    effectiveIsDay,
    isRainActive,
    isStormActive,
    handleLocationChange,
    handleReload,
    setSelectedEffect,
    setRainIntensity,
    toggleWind,
  };
}
