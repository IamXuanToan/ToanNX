"use client";

import { Droplets, Gauge, RotateCw, Wind, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";

import {
  calculateAstronomicalMoonPhase,
  getMoonPhaseDetails,
  type LocationKey,
  type WeatherData,
} from "../../store/weather-store";
import { useWeatherWidget, type WeatherInfo } from "./hooks/use-weather-widget";
import { WeatherIcon } from "./weather-icon";

export type { LocationKey, WeatherData, WeatherInfo };

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
  const {
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
  } = useWeatherWidget({ onWeatherChange, isDay: parentIsDay });

  return (
    <div
      className={`flex w-full flex-col justify-between rounded-2xl border p-4 shadow-lg backdrop-blur-xl transition-all duration-700 sm:p-5 ${
        isDay
          ? "border-white/50 bg-white/40 text-slate-800 shadow-black/5"
          : "border-white/10 bg-black/40 text-slate-100 shadow-black/20"
      }`}
    >
      {/* 1. Bộ chọn địa điểm: Đà Nẵng | Quảng Trị */}
      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-1.5 rounded-full border p-1 ${
            isDay ? "border-white/50 bg-white/40" : "border-white/10 bg-white/[0.06]"
          }`}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleLocationChange("danang")}
            className={`h-auto rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              selectedLocation === "danang"
                ? isDay
                  ? "bg-slate-900/90 text-white shadow-sm hover:bg-slate-900/90 hover:text-white"
                  : "bg-white text-slate-950 shadow-md hover:bg-white hover:text-slate-950"
                : isDay
                  ? "text-slate-700 hover:text-slate-950"
                  : "text-slate-400 hover:text-white"
            }`}
          >
            {t("locations.danang")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleLocationChange("quangtri")}
            className={`h-auto rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              selectedLocation === "quangtri"
                ? isDay
                  ? "bg-slate-900/90 text-white shadow-sm hover:bg-slate-900/90 hover:text-white"
                  : "bg-white text-slate-950 shadow-md hover:bg-white hover:text-slate-950"
                : isDay
                  ? "text-slate-700 hover:text-slate-950"
                  : "text-slate-400 hover:text-white"
            }`}
          >
            {t("locations.quangtri")}
          </Button>
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleReload}
            disabled={isUpdating}
            title={t("weather.reload")}
            aria-label={t("weather.reload")}
            className={`flex size-6 items-center justify-center rounded-full border p-0 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
              isDay
                ? "border-white/50 bg-white/40 text-slate-700 hover:bg-white/70 hover:text-slate-950"
                : "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.12] hover:text-white"
            }`}
          >
            <RotateCw className={`size-3 ${isUpdating ? "animate-spin" : ""}`} />
          </Button>
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

      {/* 3. Dải thông số khí tượng tinh giản (Độ ẩm, Gió, Áp suất) */}
      <div
        className={`flex items-center justify-between border-t pt-3 text-[11px] sm:text-xs ${
          isDay ? "border-slate-900/10 text-slate-600" : "border-white/10 text-slate-300"
        }`}
      >
        <div
          className="flex shrink-0 items-center gap-1 whitespace-nowrap sm:gap-1.5"
          title={t("weather.humidity")}
        >
          <Droplets className="size-3 text-sky-500 sm:size-3.5" />
          <span>
            {t("weather.humidity")}:{" "}
            <strong className={isDay ? "text-slate-900" : "text-white"}>
              {weatherData.humidity}%
            </strong>
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleWind}
          title={t("weather.windBoostTooltip")}
          className="flex h-auto shrink-0 items-center gap-1 p-0 text-[11px] font-normal whitespace-nowrap transition-colors hover:bg-transparent hover:opacity-80 sm:gap-1.5 sm:text-xs"
        >
          <Wind
            className={`size-3 sm:size-3.5 ${
              windMultiplier > 1 ? "animate-pulse text-amber-500" : "text-teal-500"
            }`}
          />
          <span>
            {t("weather.wind")}:{" "}
            <strong className={isDay ? "text-slate-900" : "text-white"}>
              {Math.round(weatherData.windSpeed * windMultiplier)} km/h
            </strong>
          </span>
        </Button>

        <div
          className="flex shrink-0 items-center gap-1 whitespace-nowrap sm:gap-1.5"
          title={t("weather.pressure")}
        >
          <Gauge className="size-3 text-indigo-400 sm:size-3.5" />
          <span>
            {t("weather.pressure")}:{" "}
            <strong className={isDay ? "text-slate-900" : "text-white"}>
              {weatherData.surfacePressure} hPa
            </strong>
          </span>
        </div>
      </div>

      {/* 4. Điều chỉnh độ mưa khi có mưa rơi (chỉ hiển thị trên desktop/tablet md trở lên khi có canvas hiệu ứng) */}
      {isRainActive ? (
        <div
          className={`mt-2.5 hidden w-full items-center justify-between gap-2 rounded-xl border p-1.5 text-xs md:flex ${
            isDay
              ? "border-sky-500/30 bg-sky-50/70 text-sky-950"
              : "border-sky-500/20 bg-sky-950/30 text-sky-200"
          }`}
        >
          <div className="flex shrink-0 items-center gap-1 text-[11px] font-medium">
            <Zap className="size-3 text-sky-500" />
            <span>{t("weather.rainLabel")}:</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {(["light", "medium", "heavy"] as const).map((lvl) => (
              <Button
                key={lvl}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRainIntensity(lvl)}
                className={`h-auto shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold transition-all ${
                  rainIntensity === lvl
                    ? "bg-sky-500 text-white shadow-sm hover:bg-sky-500 hover:text-white"
                    : isDay
                      ? "text-sky-800 hover:bg-sky-100"
                      : "text-sky-300 hover:bg-sky-500/20 hover:text-white"
                }`}
              >
                {t(`weather.rainIntensity.${lvl}` as Parameters<typeof t>[0])}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {/* 5. Tùy chọn hiệu ứng thời tiết gọn gàng trên 1 dòng (chỉ hiển thị trên desktop/tablet md trở lên khi có canvas hiệu ứng) */}
      <div
        className={`mt-2.5 hidden w-full grid-cols-6 items-center gap-1 border-t pt-2.5 md:grid ${
          isDay ? "border-slate-900/10" : "border-white/10"
        }`}
      >
        {(["auto", "rain", "storm", "sunny", "fog", "night"] as const).map((effectKey) => {
          const label = t(`weather.effects.${effectKey}` as Parameters<typeof t>[0]);
          return (
            <Button
              key={effectKey}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedEffect(effectKey)}
              title={label}
              className={`flex h-auto w-full min-w-0 items-center justify-center rounded-lg px-1 py-1 text-[11px] font-medium transition-all sm:text-xs ${
                selectedEffect === effectKey
                  ? isDay
                    ? "bg-slate-900 text-white shadow-sm hover:bg-slate-900 hover:text-white"
                    : "bg-white/20 text-white shadow-sm hover:bg-white/20 hover:text-white"
                  : isDay
                    ? "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900"
                    : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="truncate">{label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
