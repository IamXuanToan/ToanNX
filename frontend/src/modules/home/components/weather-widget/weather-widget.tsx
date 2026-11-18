"use client";

import {
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  Gauge,
  Moon,
  RotateCw,
  Sun,
  Wind,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Badge } from "@/shares/components/ui/badge";
import { useStoredPreference } from "@/shares/hooks/use-stored-preference";
import type { RainIntensityType, WeatherEffectType } from "../weather-canvas/weather-canvas";

import {
  CACHE_TTL_MS,
  calculateAstronomicalMoonPhase,
  getMoonPhaseDetails,
  type LocationKey,
  useWeatherStore,
  type WeatherData,
} from "../../store/weather-store";

export type { LocationKey, WeatherData };

const LOCATIONS: Record<LocationKey, { name: string; lat: number; lon: number }> = {
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

const DEFAULT_FALLBACK: Record<LocationKey, WeatherData> = {
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
function detectWeatherCondition(
  code: number,
  windGusts: number,
  windSpeed: number,
  pressure: number,
  precipitation: number,
): "clear" | "cloudy" | "fog" | "rain" | "storm" {
  // 1. Dông bão / Áp thấp nhiệt đới: WMO 95, 96, 99 hoặc gió giật mạnh / áp suất tụt kèm mưa
  if ([95, 96, 99].includes(code)) return "storm";
  if (windGusts >= 48 || windSpeed >= 35 || (pressure < 1002 && precipitation > 2)) {
    return "storm";
  }

  // 2. Sương mù & sương muối: WMO 45, 48
  if (code === 45 || code === 48) return "fog";

  // 3. Mưa (Mưa phùn, mưa rào, mưa tuyết, mưa đá): WMO 51-67, 71-77, 80-86 hoặc lượng mưa tức thời > 0.3mm
  if (
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86].includes(code) ||
    precipitation > 0.3
  ) {
    return "rain";
  }

  // 4. Mây rải rác & U ám nhiều mây: WMO 2, 3
  if (code === 2 || code === 3) return "cloudy";

  // 5. Trời quang đãng / Nắng đẹp (Clear / Mainly clear): WMO 0, 1
  return "clear";
}

/**
 * Tự động phân cấp mức độ mưa (Mưa bay, Mưa vừa, Mưa to) theo lượng mưa và mã WMO
 */
function detectRainIntensity(
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

function WeatherIcon({
  conditionKey,
  isDay,
}: {
  conditionKey: WeatherData["conditionKey"];
  isDay: boolean;
}) {
  if (!isDay) {
    return <Moon className="size-10 text-indigo-400 drop-shadow-md sm:size-12" />;
  }
  if (conditionKey === "storm") {
    return (
      <CloudLightning className="size-10 animate-pulse text-amber-500 drop-shadow-md sm:size-12" />
    );
  }
  if (conditionKey === "rain") {
    return <CloudRain className="size-10 text-sky-500 drop-shadow-md sm:size-12" />;
  }
  if (conditionKey === "fog") {
    return <CloudFog className="size-10 text-slate-400 drop-shadow-md sm:size-12" />;
  }
  if (conditionKey === "cloudy") {
    return <CloudSun className="size-10 text-amber-500 drop-shadow-md sm:size-12" />;
  }
  return <Sun className="size-10 text-amber-500 drop-shadow-md sm:size-12" />;
}

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

interface WeatherWidgetProps {
  onWeatherChange: (info: WeatherInfo) => void;
  isDay?: boolean;
}

/**
 * Widget thời tiết khí tượng trực tiếp (Live Weather & Meteorology):
 * - Hỗ trợ chọn Đà Nẵng (mặc định) và Quảng Trị, lưu cấu hình vào localStorage.
 * - Khai thác toàn diện dữ liệu Open-Meteo: Nhiệt độ, Độ ẩm, Sức gió, Gió giật, Áp suất khí quyển, Mây, Lượng mưa.
 * - Phát hiện tự động dông bão (Storm), sương mù (Fog), đêm trăng sao (Night).
 * - Khi chọn Đêm sao, lập tức chuyển toàn bộ giao diện và badge sang Ban đêm.
 * - Thẻ kính mờ trong suốt (translucent frosted glass) nhìn rõ cảnh vật thiên nhiên phía sau.
 */
export function WeatherWidget({ onWeatherChange, isDay: parentIsDay = true }: WeatherWidgetProps) {
  const t = useTranslations("common.home");
  const locale = useLocale();
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
      // 1. Kiểm tra cache Zustand in-memory nếu không phải do người dùng bấm nút Reload cưỡng bức
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

      // 2. Không có cache hoặc cache hết hạn hoặc bấm nút Reload: gọi API
      setIsUpdating(true);
      const startTime = Date.now();
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,cloud_cover,visibility&daily=sunrise,sunset,moonrise,moonset,moon_phase&timezone=Asia%2FHo_Chi_Minh`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather API error");
        const json = await res.json();
        const current = json.current;
        const daily = json.daily;

        if (!isCancelled && current) {
          const code = Number(current.weather_code ?? 0);
          const windGusts = Math.round(Number(current.wind_gusts_10m ?? 20));
          const windSpeed = Math.round(Number(current.wind_speed_10m ?? 12));
          const pressure = Math.round(Number(current.surface_pressure ?? 1013));
          const precipitation = Number(current.precipitation ?? 0);

          const sunrise =
            Array.isArray(daily?.sunrise) && daily.sunrise[0]
              ? String(daily.sunrise[0])
              : DEFAULT_FALLBACK[selectedLocation].sunrise;
          const sunset =
            Array.isArray(daily?.sunset) && daily.sunset[0]
              ? String(daily.sunset[0])
              : DEFAULT_FALLBACK[selectedLocation].sunset;
          const apiMoonPhase =
            Array.isArray(daily?.moon_phase) && daily.moon_phase[0] !== null
              ? Number(daily.moon_phase[0])
              : undefined;
          const moonPhase =
            typeof apiMoonPhase === "number" && !isNaN(apiMoonPhase)
              ? apiMoonPhase
              : calculateAstronomicalMoonPhase();

          const condKey = detectWeatherCondition(
            code,
            windGusts,
            windSpeed,
            pressure,
            precipitation,
          );

          const nextData: WeatherData = {
            temperature: Math.round(Number(current.temperature_2m ?? 28)),
            feelsLike: Math.round(Number(current.apparent_temperature ?? 30)),
            humidity: Math.round(Number(current.relative_humidity_2m ?? 75)),
            windSpeed,
            windGusts,
            surfacePressure: pressure,
            cloudCover: Math.round(Number(current.cloud_cover ?? 30)),
            visibility: Math.round(Number(current.visibility ?? 10000)),
            precipitation,
            isDay: Boolean(current.is_day ?? 1),
            weatherCode: code,
            conditionKey: condKey,
            sunrise,
            sunset,
            moonPhase,
          };

          // Lưu cache vào Zustand store kèm timestamp
          setCachedWeather(selectedLocation, nextData);

          setWeatherData(nextData);

          const intensity = detectRainIntensity(code, precipitation, condKey);
          setRainIntensity(intensity);
        }
      } catch {
        if (!isCancelled) {
          const fallback = getCachedWeather(selectedLocation) ?? DEFAULT_FALLBACK[selectedLocation];
          setWeatherData(fallback);
        }
      } finally {
        if (!isCancelled) {
          // Duy trì hiệu ứng xoay icon tối thiểu 500ms để người dùng có phản hồi thị giác
          const elapsed = Date.now() - startTime;
          const minDelay = 500;
          if (elapsed < minDelay) {
            setTimeout(() => {
              if (!isCancelled) setIsUpdating(false);
            }, minDelay - elapsed);
          } else {
            setIsUpdating(false);
          }
        }
      }
    };

    void loadWeather();
    const interval = setInterval(() => {
      setRefreshTrigger((prev) => ({ force: false, count: prev.count + 1 }));
    }, CACHE_TTL_MS);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [selectedLocation, refreshTrigger, getCachedWeather, setCachedWeather, setIsUpdating]);

  // Đồng bộ hiệu ứng thời tiết và bài nhạc tương ứng ra ngoài Canvas và Audio Player
  useEffect(() => {
    let resolvedEffect: WeatherEffectType = selectedEffect;
    if (selectedEffect === "auto") {
      if (weatherData.conditionKey === "storm") {
        resolvedEffect = "storm";
      } else if (weatherData.conditionKey === "rain") {
        resolvedEffect = "rain";
      } else if (weatherData.conditionKey === "fog") {
        resolvedEffect = "fog";
      } else if (!weatherData.isDay) {
        resolvedEffect = "night";
      } else {
        resolvedEffect = "sunny";
      }
    }

    // Khi chọn "night", trạng thái ngày/đêm gửi ra parent bắt buộc là false (Ban đêm)
    const computedIsDay =
      selectedEffect === "night" ? false : selectedEffect === "sunny" ? true : weatherData.isDay;

    let suggestedTrack: "lofi" | "rain" | "storm" | "ocean" = "lofi";
    if (resolvedEffect === "storm") {
      suggestedTrack = "storm";
    } else if (resolvedEffect === "rain") {
      suggestedTrack = "rain";
    } else if (resolvedEffect === "night" || !computedIsDay) {
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

  return (
    <div
      className={`flex w-full max-w-xl flex-col rounded-3xl border p-5 shadow-xl backdrop-blur-md transition-all duration-700 sm:p-6 ${
        isDay
          ? "border-white/40 bg-white/30 text-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
          : "border-white/10 bg-black/30 text-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
      }`}
    >
      {/* 1. Bộ chọn địa điểm: Đà Nẵng | Quảng Trị */}
      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-1.5 rounded-full border p-1 ${
            isDay ? "border-white/50 bg-white/40" : "border-white/10 bg-white/[0.06]"
          }`}
        >
          <button
            type="button"
            onClick={() => handleLocationChange("danang")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              selectedLocation === "danang"
                ? isDay
                  ? "bg-slate-900/90 text-white shadow-sm"
                  : "bg-white text-slate-950 shadow-md"
                : isDay
                  ? "text-slate-700 hover:text-slate-950"
                  : "text-slate-400 hover:text-white"
            }`}
          >
            {t("locations.danang")}
          </button>
          <button
            type="button"
            onClick={() => handleLocationChange("quangtri")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              selectedLocation === "quangtri"
                ? isDay
                  ? "bg-slate-900/90 text-white shadow-sm"
                  : "bg-white text-slate-950 shadow-md"
                : isDay
                  ? "text-slate-700 hover:text-slate-950"
                  : "text-slate-400 hover:text-white"
            }`}
          >
            {t("locations.quangtri")}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {isStormActive ? (
            <Badge
              variant="outline"
              className="animate-pulse border-amber-500/40 bg-amber-500/10 text-[11px] font-semibold text-amber-500"
            >
              <Zap className="mr-1 size-3" />
              {t("weather.stormAlert")}
            </Badge>
          ) : null}
          <Badge
            variant="outline"
            className={`text-[11px] font-medium ${
              isDay
                ? "border-white/50 bg-white/40 text-slate-700"
                : "border-white/10 bg-white/[0.05] text-slate-300"
            }`}
          >
            {isUpdating
              ? t("weather.updating")
              : effectiveIsDay
                ? t("weather.daytime")
                : t("weather.nighttime")}
          </Badge>
          <button
            type="button"
            onClick={handleReload}
            disabled={isUpdating}
            title={t("weather.reload")}
            aria-label={t("weather.reload")}
            className={`flex size-6 items-center justify-center rounded-full border transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
              isDay
                ? "border-white/50 bg-white/40 text-slate-700 hover:bg-white/70 hover:text-slate-950"
                : "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.12] hover:text-white"
            }`}
          >
            <RotateCw className={`size-3 ${isUpdating ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Nhiệt độ và biểu tượng */}
      <div className="my-auto flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <WeatherIcon conditionKey={weatherData.conditionKey} isDay={effectiveIsDay} />
          <div>
            <div className="flex items-start">
              <span
                className={`font-mono text-5xl font-black drop-shadow-sm sm:text-6xl ${
                  isDay ? "text-slate-900" : "text-white"
                }`}
              >
                {weatherData.temperature}
              </span>
              <span
                className={`text-2xl font-light ${isDay ? "text-slate-500" : "text-slate-300"}`}
              >
                °C
              </span>
            </div>
            <div
              className={`text-xs font-semibold sm:text-sm ${isDay ? "text-slate-800" : "text-slate-200"}`}
            >
              {!effectiveIsDay
                ? `${weatherData.conditionKey === "clear" ? t("weather.starryNight") : t(`weather.condition.${weatherData.conditionKey}` as Parameters<typeof t>[0])} · ${locale === "vi" ? getMoonPhaseDetails(weatherData.moonPhase ?? calculateAstronomicalMoonPhase()).nameVi : getMoonPhaseDetails(weatherData.moonPhase ?? calculateAstronomicalMoonPhase()).nameEn}`
                : t(`weather.condition.${weatherData.conditionKey}` as Parameters<typeof t>[0])}
            </div>
          </div>
        </div>

        {/* Cảm giác như */}
        <div className="text-right">
          <div className={`text-xs ${isDay ? "text-slate-500" : "text-slate-400"}`}>
            {t("weather.feelsLike")}
          </div>
          <div
            className={`font-mono text-xl font-bold ${isDay ? "text-slate-800" : "text-slate-200"}`}
          >
            {weatherData.feelsLike}°C
          </div>
        </div>
      </div>

      {/* 3. Dải thông số khí tượng tinh giản (Độ ẩm, Gió, Mây) */}
      <div
        className={`flex items-center justify-between border-t pt-3 text-xs ${
          isDay ? "border-slate-900/10 text-slate-600" : "border-white/10 text-slate-300"
        }`}
      >
        <div className="flex items-center gap-1.5" title={t("weather.humidity")}>
          <Droplets className="size-3.5 text-sky-500" />
          <span>
            {t("weather.humidity")}:{" "}
            <strong className={isDay ? "text-slate-900" : "text-white"}>
              {weatherData.humidity}%
            </strong>
          </span>
        </div>

        <button
          type="button"
          onClick={toggleWind}
          title={t("weather.windBoostTooltip")}
          className="flex items-center gap-1.5 transition-colors hover:opacity-80"
        >
          <Wind
            className={`size-3.5 ${
              windMultiplier > 1 ? "animate-pulse text-amber-500" : "text-teal-500"
            }`}
          />
          <span>
            {t("weather.wind")}:{" "}
            <strong className={isDay ? "text-slate-900" : "text-white"}>
              {Math.round(weatherData.windSpeed * windMultiplier)} km/h
            </strong>
          </span>
        </button>

        <div className="flex items-center gap-1.5" title={t("weather.pressure")}>
          <Gauge className="size-3.5 text-indigo-400" />
          <span>
            {t("weather.pressure")}:{" "}
            <strong className={isDay ? "text-slate-900" : "text-white"}>
              {weatherData.surfacePressure} hPa
            </strong>
          </span>
        </div>
      </div>

      {/* 4. Điều chỉnh độ mưa khi có mưa rơi */}
      {isRainActive ? (
        <div
          className={`mt-2.5 flex items-center justify-between gap-2 rounded-xl border p-1.5 text-xs ${
            isDay
              ? "border-sky-500/30 bg-sky-50/70 text-sky-950"
              : "border-sky-500/20 bg-sky-950/30 text-sky-200"
          }`}
        >
          <div className="flex items-center gap-1 text-[11px] font-medium">
            <Zap className="size-3 text-sky-500" />
            <span>{t("weather.rainLabel")}:</span>
          </div>
          <div className="flex items-center gap-1">
            {(["light", "medium", "heavy"] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setRainIntensity(lvl)}
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-all ${
                  rainIntensity === lvl
                    ? "bg-sky-500 text-white shadow-sm"
                    : isDay
                      ? "text-sky-800 hover:bg-sky-100"
                      : "text-sky-300 hover:bg-sky-500/20 hover:text-white"
                }`}
              >
                {t(`weather.rainIntensity.${lvl}` as Parameters<typeof t>[0])}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* 5. Tùy chọn hiệu ứng thời tiết gọn gàng trên 1 dòng */}
      <div
        className={`mt-2.5 flex items-center justify-between gap-1 border-t pt-2.5 ${
          isDay ? "border-slate-900/10" : "border-white/10"
        }`}
      >
        {(
          [
            { key: "auto" },
            { key: "rain" },
            { key: "storm", icon: Zap },
            { key: "sunny" },
            { key: "fog", icon: CloudFog },
            { key: "night", icon: Moon },
          ] as { key: WeatherEffectType; icon?: typeof Zap }[]
        ).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelectedEffect(item.key)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-medium transition-all ${
                selectedEffect === item.key
                  ? isDay
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white/20 text-white shadow-sm"
                  : isDay
                    ? "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900"
                    : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {Icon ? <Icon className="size-3" /> : null}
              <span>{t(`weather.effects.${item.key}` as Parameters<typeof t>[0])}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
