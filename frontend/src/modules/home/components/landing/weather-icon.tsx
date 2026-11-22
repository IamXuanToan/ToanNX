"use client";

import { CloudFog, CloudLightning, CloudRain, CloudSun, Moon, Sun } from "lucide-react";

import { type WeatherData } from "../../store/weather-store";

export function WeatherIcon({
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
