"use client";

import { useLocale, useTranslations } from "next-intl";

import { ChillAudio } from "./chill-audio";
import { ClockWidget } from "./clock-widget";
import { WeatherCanvas } from "./weather-canvas";
import { WeatherWidget } from "./weather-widget";
import { useHomeHero } from "./hooks/use-home-hero";

/**
 * Giao diện trang chủ cá nhân của Xuân Toàn (Chill & Peaceful Space):
 * - Tự động đồng bộ Theme: Ban ngày là Light theme, Ban đêm & Bão là Dark theme (chỉ áp dụng trên trang Home).
 * - Bối cảnh chân trang (footer diorama): Cây xanh, hồ cá Koi, chàng trai câu cá, nhà cổ tích, chuồng chó và chuồng mèo mướp.
 * - Toàn bộ hoạt cảnh thu gọn tinh tế ở đáy trang để không che lấp các card thông tin trung tâm.
 * - Bầu trời thoáng đãng, đồng điệu với thời tiết: Nắng ấm, Đêm sao, Mưa rơi, Dông bão, Sương mù.
 * - Các thẻ thông tin kính mờ trong suốt (translucent frosted glass) nhìn xuyên thấu cảnh vật thiên nhiên phía sau.
 * - Thời tiết trực tiếp từ Open-Meteo cho Đà Nẵng (mặc định) và Quảng Trị, lưu cấu hình vào localStorage.
 * - Đồng hồ múi giờ GMT+7 (Hồ Chí Minh).
 * - Trình phát thanh âm thư giãn Web Audio API: Tự động phát khi vào trang, gợi ý theo thời tiết (Lofi, Mưa rơi, Dông bão, Sóng biển).
 */
export function HomeHero() {
  const t = useTranslations("common.home");
  const locale = useLocale();

  const {
    weatherState,
    thunderTrigger,
    handleWeatherChange,
    handleThunderStrike,
    isNight,
    isDay,
    isStorm,
    isFog,
  } = useHomeHero();

  return (
    <div
      className={`relative flex min-h-svh w-full flex-col justify-between overflow-x-hidden transition-colors duration-1000 select-none ${
        isStorm
          ? "dark bg-gradient-to-b from-[#0b0e17] via-[#0f1422] to-[#090c14] text-slate-100"
          : isNight
            ? "dark bg-gradient-to-b from-[#050711] via-[#080d1e] to-[#04060d] text-slate-100"
            : isFog
              ? "bg-gradient-to-b from-[#cedee8] via-[#dae6ee] to-[#e7f0f5] text-slate-800"
              : "bg-gradient-to-b from-[#eaf4fc] via-[#f3f7fa] to-[#f9fbfb] text-slate-800"
      }`}
    >
      {/* 1. Canvas thiên nhiên & thời tiết chi tiết cao (chỉ hiển thị trên tablet & desktop: md trở lên) */}
      <div className="hidden md:block">
        <WeatherCanvas
          effect={weatherState.effect}
          temperature={weatherState.temperature}
          isDay={isDay}
          windSpeed={weatherState.windSpeed}
          rainIntensity={weatherState.rainIntensity}
          sunrise={weatherState.sunrise}
          sunset={weatherState.sunset}
          moonPhase={weatherState.moonPhase}
          onThunderStrike={handleThunderStrike}
          locale={locale}
        />
      </div>

      {/* 2. Nội dung trung tâm: Lời chào, Đồng hồ và Thời tiết */}
      <div className="relative z-10 mx-auto my-auto flex w-full max-w-4xl flex-col items-center px-4 pt-24 pb-16 sm:px-6 sm:pt-20 sm:pb-24 md:-translate-y-8 md:pt-16 md:pb-28 lg:-translate-y-10">
        {/* Lời chào nhẹ nhàng */}
        <div className="text-center">
          <p
            className={`text-xs font-bold tracking-[0.22em] uppercase sm:text-sm ${
              isStorm || isNight ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {t("greeting")}
          </p>
          <h1
            className={`mt-1 text-4xl font-black tracking-tight drop-shadow-sm sm:text-5xl md:text-6xl ${
              isStorm || isNight
                ? "bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-transparent"
                : "bg-gradient-to-b from-slate-950 via-slate-800 to-slate-700 bg-clip-text text-transparent"
            }`}
          >
            {t("name")}
          </h1>
        </div>

        {/* Cụm Widget trong suốt nhìn xuyên thấu: Đồng hồ và Thời tiết (1 cột ở mobile, 2 cột từ tablet/desktop md) */}
        <div className="mt-6 grid w-full grid-cols-1 items-stretch gap-4 sm:mt-8 md:grid-cols-2">
          {/* Widget Đồng hồ múi giờ GMT+7 */}
          <ClockWidget isDay={isDay && !isStorm} />

          {/* Widget Thời tiết Đà Nẵng / Quảng Trị */}
          <WeatherWidget onWeatherChange={handleWeatherChange} isDay={isDay && !isStorm} />
        </div>

        {/* Thanh âm thư giãn trong suốt (Lofi / Mưa / Dông bão / Sóng biển) */}
        <div className="mt-4 w-full max-w-xl sm:mt-5">
          <ChillAudio
            isDay={isDay && !isStorm}
            suggestedTrack={weatherState.suggestedTrack}
            thunderTrigger={thunderTrigger}
          />
        </div>
      </div>
    </div>
  );
}
