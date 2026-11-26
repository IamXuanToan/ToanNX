"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { DEFAULT_TIMEZONE } from "@/shares/constants/locale";
import { useStoredPreference } from "@/shares/hooks/use-stored-preference";

import {
  DEFAULT_WEATHER_FALLBACK,
  LEGACY_WEATHER_CACHE_KEYS,
  WEATHER_LOCATION_STORAGE_KEY,
  WEATHER_LOCATIONS,
  WEATHER_QUERY_CURRENT_FIELDS,
  WEATHER_QUERY_DAILY_FIELDS,
} from "../../../constants/weather-config";
import {
  detectRainIntensity,
  detectWeatherCondition,
  isDaytimeBySchedule,
} from "../../../lib/weather-detection";
import {
  calculateAstronomicalMoonPhase,
  type LocationKey,
  useWeatherStore,
  type WeatherData,
} from "../../../store/weather-store";
import type { RainIntensityType, WeatherEffectType } from "../weather-canvas";

const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

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
  const isMounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const [selectedLocation, setSelectedLocation] = useStoredPreference<LocationKey>(
    WEATHER_LOCATION_STORAGE_KEY,
    "danang",
    isLocationKey,
  );
  const [liveWeatherData, setLiveWeatherData] = useState<WeatherData | null>(null);
  const fallbackWeather = DEFAULT_WEATHER_FALLBACK[selectedLocation];
  const weatherData: WeatherData = liveWeatherData ?? {
    ...fallbackWeather,
    isDay: isMounted ? isDaytimeBySchedule(fallbackWeather.sunrise, fallbackWeather.sunset) : false,
  };
  const [selectedEffect, setSelectedEffect] = useState<WeatherEffectType>("auto");
  const [rainIntensity, setRainIntensity] = useState<RainIntensityType>("medium");
  const [windMultiplier, setWindMultiplier] = useState<number>(1);
  const { isUpdating, setIsUpdating, getCachedWeather, setCachedWeather, clearCache } =
    useWeatherStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState<{ force: boolean; count: number }>({
    force: false,
    count: 0,
  });

  // Khởi tạo rehydrate từ LocalStorage sau SSR và dọn key cache cũ
  useEffect(() => {
    try {
      for (const cacheKey of LEGACY_WEATHER_CACHE_KEYS) {
        localStorage.removeItem(cacheKey);
      }
    } catch {
      // bỏ qua
    }
    Promise.resolve(useWeatherStore.persist.rehydrate())
      .catch(() => undefined)
      .finally(() => setHasHydrated(true));
  }, []);

  // Xác định trạng thái ngày/đêm hiệu lực: khi chọn "night", bắt buộc là ban đêm
  const effectiveIsDay =
    selectedEffect === "night" ? false : selectedEffect === "sunny" ? true : weatherData.isDay;

  // Sử dụng effectiveIsDay để widget phản ánh ngay trạng thái theme khi người dùng chọn hiệu ứng
  const isDay = parentIsDay && effectiveIsDay;

  // Fetch dữ liệu thời tiết chi tiết từ Open-Meteo API kèm cache LocalStorage 15 phút qua Zustand persist
  useEffect(() => {
    if (!hasHydrated) return;

    const loc = WEATHER_LOCATIONS[selectedLocation];
    const querySignature = `${loc.lat}:${loc.lon}:${WEATHER_QUERY_CURRENT_FIELDS}:${WEATHER_QUERY_DAILY_FIELDS}:${DEFAULT_TIMEZONE}`;
    let isCancelled = false;

    const loadWeather = async () => {
      if (!refreshTrigger.force) {
        const cached = getCachedWeather(selectedLocation, querySignature);
        if (cached) {
          if (!isCancelled) {
            setLiveWeatherData({
              ...cached,
              isDay: isDaytimeBySchedule(cached.sunrise, cached.sunset),
            });
            const intensity = detectRainIntensity(
              cached.weatherCode,
              cached.precipitation,
              cached.conditionKey,
            );
            setRainIntensity(intensity);
          }
          return;
        }
        clearCache(selectedLocation);
      }

      setIsUpdating(true);
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=${WEATHER_QUERY_CURRENT_FIELDS}&daily=${WEATHER_QUERY_DAILY_FIELDS}&timezone=${encodeURIComponent(DEFAULT_TIMEZONE)}`,
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

        const fallbackLoc = DEFAULT_WEATHER_FALLBACK[selectedLocation];
        const sunriseStr = daily?.sunrise?.[0]?.split("T")[1] ?? fallbackLoc.sunrise;
        const sunsetStr = daily?.sunset?.[0]?.split("T")[1] ?? fallbackLoc.sunset;
        const resolvedIsDay =
          typeof cur.is_day === "number"
            ? cur.is_day === 1
            : isDaytimeBySchedule(sunriseStr, sunsetStr);

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
          isDay: resolvedIsDay,
          weatherCode: wCode,
          conditionKey: condKey,
          sunrise: sunriseStr,
          sunset: sunsetStr,
          moonPhase: moonPhaseVal,
        };

        if (!isCancelled) {
          setLiveWeatherData(parsedData);
          setRainIntensity(calculatedRainIntensity);
          setCachedWeather(selectedLocation, parsedData, querySignature);
        }
      } catch {
        if (!isCancelled) {
          const fallback = DEFAULT_WEATHER_FALLBACK[selectedLocation];
          setLiveWeatherData({
            ...fallback,
            isDay: isDaytimeBySchedule(fallback.sunrise, fallback.sunset),
          });
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
  }, [
    hasHydrated,
    selectedLocation,
    refreshTrigger,
    getCachedWeather,
    setCachedWeather,
    clearCache,
    setIsUpdating,
  ]);

  // Cập nhật tự động khi thời gian hệ thống vượt mốc bình minh/hoàng hôn mà không cần tải lại API
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveWeatherData((prev) => {
        if (!prev) return prev;
        const nextIsDay = isDaytimeBySchedule(prev.sunrise, prev.sunset);
        return prev.isDay === nextIsDay ? prev : { ...prev, isDay: nextIsDay };
      });
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  // Đồng bộ thời tiết & gợi ý bản nhạc tương thích lên component cha HomeHero
  useEffect(() => {
    let resolvedEffect: WeatherEffectType = selectedEffect;
    if (resolvedEffect === "auto") {
      if (weatherData.conditionKey === "storm") {
        resolvedEffect = "storm";
      } else if (weatherData.conditionKey === "rain") {
        resolvedEffect = "rain";
      } else if (weatherData.conditionKey === "fog") {
        resolvedEffect = "fog";
      } else {
        resolvedEffect = weatherData.isDay ? "sunny" : "night";
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
