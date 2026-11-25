import {
  calculateAstronomicalMoonPhase,
  type LocationKey,
  type WeatherData,
} from "../store/weather-store";

/** Khóa lưu vị trí thời tiết đã chọn trong LocalStorage. */
export const WEATHER_LOCATION_STORAGE_KEY = "home_location";

/** Các khóa cache thời tiết cũ cần dọn khi khởi tạo widget. */
export const LEGACY_WEATHER_CACHE_KEYS = [
  "home_weather_cache_danang",
  "home_weather_cache_quangtri",
] as const;

/** Tọa độ địa điểm hỗ trợ hiển thị trên widget thời tiết trang chủ. */
export const WEATHER_LOCATIONS: Record<LocationKey, { name: string; lat: number; lon: number }> = {
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

/** Dữ liệu thời tiết dự phòng khi chưa tải được Open-Meteo hoặc ngoại tuyến. */
export const DEFAULT_WEATHER_FALLBACK: Record<LocationKey, WeatherData> = {
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
