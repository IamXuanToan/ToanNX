"use client";

import { type RainIntensityType, useWeatherCanvas, type WeatherCanvasProps, type WeatherEffectType } from "./hooks/use-weather-canvas";

export type { RainIntensityType, WeatherCanvasProps, WeatherEffectType };

/**
 * Khung vẽ canvas diễn hoạt thời tiết và phong cảnh trang chủ (Peaceful Diorama):
 * - Tự động đồng bộ bầu trời: Nắng ấm, Đêm sao, Mưa rơi, Dông bão & Sấm sét, Sương mù.
 * - Khung cảnh thiên nhiên chân trang: Hồ cá Koi bơi lội, chàng trai buông cần câu, chú chó Shiba, mèo mướp và nhà nhỏ phong cách Studio Ghibli.
 * - Toàn bộ hoạt họa canvas chạy trên luồng requestAnimationFrame được đóng gói trong hook useWeatherCanvas.
 *
 * @param props - Thuộc tính `WeatherCanvasProps`.
 * @returns Thẻ canvas hiển thị toàn màn hình.
 */
export function WeatherCanvas(props: WeatherCanvasProps) {
  const { canvasRef } = useWeatherCanvas(props);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 size-full transition-opacity duration-1000"
    />
  );
}
