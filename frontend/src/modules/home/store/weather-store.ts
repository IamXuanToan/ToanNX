import { create } from "zustand";

export type LocationKey = "danang" | "quangtri";

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGusts: number;
  surfacePressure: number;
  cloudCover: number;
  visibility: number;
  precipitation: number;
  isDay: boolean;
  weatherCode: number;
  conditionKey: "clear" | "cloudy" | "fog" | "rain" | "storm";
  sunrise?: string;
  sunset?: string;
  moonPhase?: number;
}

export interface MoonPhaseInfo {
  phase: number;
  nameVi: string;
  nameEn: string;
  illumination: number;
}

/**
 * Thuật toán tính toán pha mặt trăng thiên văn (Meeus algorithm):
 * Chu kỳ tuần trăng bình quân: 29.53058867 ngày.
 * Pha từ 0.0 đến 1.0 (0.0: Trăng mới, 0.25: Trăng bán nguyệt đầu tháng, 0.50: Trăng rằm tròn, 0.75: Trăng bán nguyệt cuối tháng).
 */
export function calculateAstronomicalMoonPhase(date: Date = new Date()): number {
  const KNOWN_NEW_MOON = 947182440000; // Jan 6, 2000, 18:14 UTC
  const SYNODIC_MONTH = 29.53058867 * 86400 * 1000;
  const diff = date.getTime() - KNOWN_NEW_MOON;
  const phase = (diff % SYNODIC_MONTH) / SYNODIC_MONTH;
  return phase < 0 ? phase + 1 : phase;
}

/**
 * Lấy tên gọi và tỷ lệ chiếu sáng (%) của mặt trăng theo pha
 */
export function getMoonPhaseDetails(phase: number): MoonPhaseInfo {
  const p = ((phase % 1) + 1) % 1;
  const illumination = Math.round(((1 - Math.cos(p * Math.PI * 2)) / 2) * 100);

  if (p < 0.03 || p >= 0.97) {
    return { phase: p, nameVi: "Trăng non (Mới)", nameEn: "New Moon", illumination };
  }
  if (p < 0.22) {
    return { phase: p, nameVi: "Trăng lưỡi liềm đầu tháng", nameEn: "Waxing Crescent", illumination };
  }
  if (p <= 0.28) {
    return { phase: p, nameVi: "Trăng bán nguyệt đầu tháng", nameEn: "First Quarter", illumination };
  }
  if (p < 0.47) {
    return { phase: p, nameVi: "Trăng khuyết đầu tháng", nameEn: "Waxing Gibbous", illumination };
  }
  if (p <= 0.53) {
    return { phase: p, nameVi: "Trăng tròn (Trăng rằm)", nameEn: "Full Moon", illumination };
  }
  if (p < 0.72) {
    return { phase: p, nameVi: "Trăng khuyết cuối tháng", nameEn: "Waning Gibbous", illumination };
  }
  if (p <= 0.78) {
    return { phase: p, nameVi: "Trăng bán nguyệt cuối tháng", nameEn: "Last Quarter", illumination };
  }
  return { phase: p, nameVi: "Trăng lưỡi liềm cuối tháng", nameEn: "Waning Crescent", illumination };
}

export interface WeatherCacheItem {
  data: WeatherData;
  timestamp: number;
}

interface WeatherStoreState {
  cache: Partial<Record<LocationKey, WeatherCacheItem>>;
  isUpdating: boolean;
  setCachedWeather: (location: LocationKey, data: WeatherData) => void;
  getCachedWeather: (location: LocationKey, maxAgeMs?: number) => WeatherData | null;
  setIsUpdating: (isUpdating: boolean) => void;
  clearCache: (location?: LocationKey) => void;
}

export const CACHE_TTL_MS = 3 * 60 * 1000; // 3 phút

/**
 * Zustand store lưu trữ dữ liệu thời tiết và cache in-memory 3 phút.
 * Khi người dùng reload/F5 trình duyệt, cache in-memory tự động được xóa để cho phép gọi API lấy dữ liệu mới nhất.
 */
export const useWeatherStore = create<WeatherStoreState>((set, get) => ({
  cache: {},
  isUpdating: false,
  setCachedWeather: (location, data) =>
    set((state) => ({
      cache: {
        ...state.cache,
        [location]: {
          data,
          timestamp: Date.now(),
        },
      },
    })),
  getCachedWeather: (location, maxAgeMs = CACHE_TTL_MS) => {
    const item = get().cache[location];
    if (!item) return null;
    if (Date.now() - item.timestamp < maxAgeMs) {
      return item.data;
    }
    return null;
  },
  setIsUpdating: (isUpdating) => set({ isUpdating }),
  clearCache: (location) =>
    set((state) => {
      if (location) {
        const next = { ...state.cache };
        delete next[location];
        return { cache: next };
      }
      return { cache: {} };
    }),
}));
