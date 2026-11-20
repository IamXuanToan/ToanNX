"use client";

import { useCallback, useState } from "react";

import type { WeatherInfo } from "./use-weather-widget";

/**
 * Hook điều phối toàn bộ trạng thái thời tiết, sấm sét và giao diện ngày/đêm trên trang Home.
 *
 * @returns Trạng thái thời tiết, trigger tia sét, các cờ boolean isNight, isDay, isStorm, isFog và các callback xử lý.
 */
export function useHomeHero() {
  const [weatherState, setWeatherState] = useState<WeatherInfo>({
    effect: "sunny",
    temperature: 28,
    isDay: true,
    windSpeed: 12,
    rainIntensity: "medium",
    suggestedTrack: "lofi",
  });

  const [thunderTrigger, setThunderTrigger] = useState(0);

  const handleWeatherChange = useCallback((info: WeatherInfo) => {
    setWeatherState((prev) => {
      if (
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

  const isNight = weatherState.effect === "night" || !weatherState.isDay;
  const isDay = !isNight;
  const isStorm = weatherState.effect === "storm";
  const isFog = weatherState.effect === "fog";

  return {
    weatherState,
    thunderTrigger,
    handleWeatherChange,
    handleThunderStrike,
    isNight,
    isDay,
    isStorm,
    isFog,
  };
}
