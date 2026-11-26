# Module Home (chỉ FE)

Trang công khai của toannx.com: trang chủ, header công khai, trang lỗi và 404. Không có module BE tương ứng.

- FE: `frontend/src/modules/home/`

## Thành phần

| View | Vai trò |
| --- | --- |
| `HomeView` | Trang chủ `/vi` |
| `NotFoundView` | 404 (một ngôn ngữ, không lặp tiền tố locale) |
| `AppErrorView`, `GlobalErrorView` | Lỗi trong trang / lỗi toàn cục (`global-error.tsx`) |

Header công khai và các thành phần trang chủ nằm ở `components/`.

## Quy định

- Trang công khai không kiểm quyền; không import gì từ `manage-app`.
- Metadata qua `createPageMetadata` (`shares/lib/seo.ts`).
- Widget thời tiết trang chủ (`useWeatherWidget` + `WeatherStore`) cache kết quả Open-Meteo **`15 phút`** (`900s`) qua Zustand `persist` vào `localStorage` (`home_weather_cache`) để tải lại trang (F5) không gọi trùng API.
