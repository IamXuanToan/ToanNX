"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

import { DEFAULT_WEATHER_FALLBACK } from "../../../constants/weather-config";
import { isDaytimeBySchedule } from "../../../lib/weather-detection";
import type { WeatherInfo } from "./use-weather-widget";

const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Hook điều phối toàn bộ trạng thái thời tiết, sấm sét và giao diện ngày/đêm trên trang Home.
 *
 * @returns Trạng thái thời tiết, trigger tia sét, các cờ boolean isNight, isDay, isStorm, isFog và các callback xử lý.
 */
export function useHomeHero() {
  const isMounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const [weatherState, setWeatherState] = useState<WeatherInfo | null>(null);

  const [thunderTrigger, setThunderTrigger] = useState(0);

  const handleWeatherChange = useCallback((info: WeatherInfo) => {
    setWeatherState((prev) => {
      if (
        prev &&
        prev.effect === info.effect &&
        prev.temperature === info.temperature &&
        prev.isDay === info.isDay &&
        prev.windSpeed === info.windSpeed &&
        prev.rainIntensity === info.rainIntensity &&
        prev.suggestedTrack === info.suggestedTrack &&
        prev.sunrise === info.sunrise &&
        prev.sunset === info.sunset &&
        prev.moonPhase === info.moonPhase
      ) {
        return prev;
      }
      return info;
    });
  }, []);

  const handleThunderStrike = useCallback(() => {
    setThunderTrigger((prev) => prev + 1);
  }, []);

  const fallback = DEFAULT_WEATHER_FALLBACK.danang;
  const fallbackIsDay = isMounted ? isDaytimeBySchedule(fallback.sunrise, fallback.sunset) : false;
  const resolvedWeather: WeatherInfo = weatherState ?? {
    effect: fallbackIsDay ? "sunny" : "night",
    temperature: fallback.temperature,
    isDay: fallbackIsDay,
    windSpeed: fallback.windSpeed,
    rainIntensity: "medium",
    suggestedTrack: fallbackIsDay ? "lofi" : "ocean",
    sunrise: fallback.sunrise,
    sunset: fallback.sunset,
    moonPhase: fallback.moonPhase,
  };

  const isNight = resolvedWeather.effect === "night" || !resolvedWeather.isDay;
  const isDay = !isNight;
  const isStorm = resolvedWeather.effect === "storm";
  const isFog = resolvedWeather.effect === "fog";

  return {
    weatherState: resolvedWeather,
    hasWeatherReady: weatherState !== null && isMounted,
    thunderTrigger,
    handleWeatherChange,
    handleThunderStrike,
    isNight,
    isDay,
    isStorm,
    isFog,
  };
}
