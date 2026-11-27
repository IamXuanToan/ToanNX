# Ghi chú bàn giao: Tối ưu tài nguyên & hạn mức Free Tier (`ToanNX`)

> Thời điểm tạm dừng: `2026-11-26 17:17 (+07:00)`
> Nhánh hiện tại: chưa thực hiện thao tác Git (chưa commit/push theo quy tắc repo).

---

## 1. Phần code & kiểm thử tự động ĐÃ HOÀN THÀNH

### 1.1. Backend (`Django` / `DRF`)

- **Health Check 0 DB / 0 Redis (`[VERIFIED]`):**
  - Thêm `backend/app/system/tests/test_health_api.py`: xác nhận `GET /api/v1/system/health` chạy `0` SQL query (`django_assert_num_queries(0)`) và `0` lệnh Redis (`fake_redis.commands == 0`), còn `/health/ready` kiểm kết nối DB (`SELECT 1`).
- **Notification Idle Recheck `6h -> 24h` (`[VERIFIED]`):**
  - `backend/app/system/services/notification_kick_service.py`: nâng `IDLE_RECHECK_SECONDS` lên `24 * 3600` (QStash/cron fallback `10 phút` vẫn chạy an toàn; `notify()` và retry cập nhật `NEXT_DUE_KEY` sớm hơn trước khi publish).
  - Mở rộng `test_notification_kick_service.py` và `test_notification_dispatch_api.py`.
- **Cache Redis `SettingService.get_public_settings()` TTL `600s` (`[VERIFIED]`):**
  - Thêm `backend/app/system/constants/setting_cache.py` và cập nhật `backend/app/system/services/setting_service.py` (`public_cache_namespace = "system:settings:public"`, chỉ cache `is_public=True`, fallback DB khi Redis lỗi, `set_setting_value()` bọc `@transaction.atomic` + `invalidate_public_cache()` sau commit).
  - Mở rộng `test_public_setting_api.py`.
- **Cache Redis Donation Public Feed & Leaderboard (`[VERIFIED]`):**
  - `backend/app/utilities/constants/donation_constants.py` & `backend/app/utilities/services/donation_transaction_service.py`: dùng `public_cache_namespace = PUBLIC_CACHE_NAMESPACE` (`"utilities:public"`), cache `list_public_feed()` (`600s`, trang không tồn tại `60s`) và `list_public_leaderboard()` (`<= 600s`, cắt TTL theo `tier_expires_at` gần nhất), invalidation trong `ingest_webhook()` và `update()` (`@transaction.atomic`, `get_for_write()`).
  - Mở rộng `test_donation_public_feed_api.py` và thêm `backend/app/utilities/tests/test_donation_public_leaderboard_api.py`.
- **Cache Redis `R2UsageService` TTL `300s` + kiểm hạn mức tươi khi upload (`[VERIFIED]`):**
  - Thêm `backend/app/system/constants/storage_cache.py`, cập nhật `backend/app/system/services/attachment_service.py` (`get_current_storage_usage_bytes(*, use_cache: bool = True)`, `create()` giữ `use_cache=False` để bảo vệ trần `9 GB`) và `attachment_purge_service.py` (invalidate `system:storage:r2_usage_bytes` sau commit khi thay đổi/purge).
  - Mở rộng `test_attachment_storage_usage.py`.
- **Workspace Cron W4 tối ưu Scale-to-Zero (`[VERIFIED]`):**
  - `backend/app/workspace/constants/workspace_defaults.py`, `workspace_alerts_cache_service.py`, `workspace_cron_service.py`:
    - `compute_next_due_epoch() -> int | None`: bỏ tự hẹn QStash `+24h` vô điều kiện khi rảnh; ghi `now_ts + 7 * 86400` vào Redis `alerts_next_due` và bỏ qua QStash publish.
    - Bổ sung lookahead `ALERT_LOOKAHEAD_WINDOW_DAYS = 90` cho bảo hành `Asset` & gia hạn `Subscription` qua `_earliest_threshold_alert_ts()`, Redis marker chống gửi lặp (`REDIS_REMINDER_SENT_KEY`, `REDIS_ALERT_SENT_KEY`), `REMINDER_BACKSTOP_WINDOW_SECONDS = 48 * 3600`.
    - `_run_w4_alerts(now, force=True)` trên `/dispatch-due` bỏ qua DB (`0 SQL`) nếu Redis `alerts_next_due > now_ts + DISPATCH_DUE_SKEW_SECONDS` (`2s`).
  - Mở rộng `test_cron_tick_api.py` và `test_cron_dispatch_due_api.py`.
- **Kết quả kiểm tra BE (đã pass sau lần sửa BE cuối):**
  - `uv run ruff format` & `uv run ruff check` (20 files): pass, `0` lỗi.
  - `uv run mypy` (11 source files): `Success`.
  - `uv run pytest --reuse-db -q` (16 test files liên quan): **`102 passed in 3.94s`**.
  - `uv run python manage.py spectacular --validate --fail-on-warn --file schema.yaml`: pass (exit `0`).

### 1.2. Frontend (`Next.js` / `React` / `TanStack Query` / `Zustand`)

- **Dọn dead code & domain legacy:**
  - Đã xóa `frontend/src/shares/lib/api/server-api.ts` (0 caller).
  - Gỡ `api.qrserver.com`, `www.google.com`, `icons.duckduckgo.com` khỏi `images.remotePatterns` trong `frontend/next.config.ts` (giữ `cloudflareinsights.com` trong CSP và các domain CDN còn dùng).
- **React Query Retry (`shouldRetryQuery`):**
  - Thêm `frontend/src/shares/constants/query-config.ts` (`QUERY_STALE_TIME_MS = 30_000`, `QUERY_MAX_RETRIES = 2`, `NON_RETRYABLE_API_ERROR_CODES`) và cập nhật `frontend/src/shares/lib/query-client.ts` (tối đa 2 retry cho mạng/timeout/5xx; tắt retry cho 4xx, `429`/`RATE_LIMITED`, `QUOTA_EXCEEDED`, `VALIDATION_ERROR`, `AUTH_*`, `PERMISSION_DENIED`, `NOT_FOUND`, `CONFLICT`, `BUSINESS_RULE_VIOLATION`, `REQUEST_CANCELLED`, `INVALID_RESPONSE`; `mutations: { retry: false }`).
  - Thêm `frontend/tests/unit/query-client.test.ts`.
- **Donation Feed/Leaderboard Polling (`60s` / `120s`, foreground-only):**
  - Thêm `frontend/src/shares/hooks/use-page-visibility.ts` và `frontend/src/modules/utilities/constants/polling.ts`, cập nhật `donation-public-feed.tsx` (`refetchIntervalInBackground: false`, chỉ poll tab đang chọn khi trang hiển thị).
  - Mở rộng `tests/unit/donation-public-feed.test.tsx`.
- **NotificationBell (`15p` / `30p`) & khử trùng Push (`24h`):**
  - Thêm `frontend/src/modules/system/constants/notification-polling.ts`, cập nhật `use-unread-count.ts` (`15 phút` khi tắt Push / `30 phút` khi bật Push, `staleTime` `2 phút` / `5 phút`, `refetchIntervalInBackground: false`, `refetchOnWindowFocus: true`) và `use-push-registration.ts` (lưu digest FNV-1a trong `localStorage` khóa `system_push_device_sync` TTL `24h`, nút `enable()` vẫn ép đăng ký).
  - Thêm `tests/unit/unread-count.test.tsx` và `tests/unit/push-registration.test.tsx`.
- **Weather Widget cache `15 phút` + Zustand `persist` (`localStorage`):**
  - Cập nhật `frontend/src/modules/home/constants/weather-config.ts` (`WEATHER_CACHE_TTL_MS = 15 * 60_000`, `WEATHER_CACHE_STORAGE_KEY = "home_weather_cache"`), `store/weather-store.ts` (`skipHydration: true`), `hooks/use-weather-widget.ts` (`rehydrate()` trong `useEffect`).
  - Mở rộng `tests/unit/home-weather-logic.test.tsx`.
- **Tối ưu Image Optimization (`unoptimized` có chọn lọc):**
  - Gắn `unoptimized` cho ảnh R2/CDN động tại: `author-table.tsx`, `novel-table.tsx`, `novel-detail.tsx`, `novel-card.tsx`, `novel-favorites.tsx`, `reading-history.tsx`, `qr-code-table.tsx`, `qr-code-picker.tsx`, `image-upload.tsx`, `attachment-preview.tsx` (giữ Next image optimization cho tài nguyên tĩnh như `logo-mark.png`, `auth-banner.jpg`).
- **Kết quả kiểm tra FE (đã pass sau lần sửa FE cuối):**
  - `prettier --write`, `eslint`, `pnpm typecheck` (`next typegen && tsc --noEmit`): pass.
  - Vitest 9 file (`module-structure`, `one-unit-per-file`, `code-conventions`, `donation-keys`, `query-client`, `unread-count`, `push-registration`, `donation-public-feed`, `home-weather-logic`): **`495 passed in 3.09s`**.
  - `pnpm build`: pass (213 static/dynamic routes; `frontend/tsconfig.json` sạch).

---

## 2. Phần UI Playwright ĐÃ KIỂM TRA được

Kiểm tra trên bản production build (`next start -p 3001`, các file ảnh chụp lưu tạm tại thư mục scratch của hội thoại nếu cần xem lại):

- **`/vi` (Trang chủ — desktop `1280x800` & mobile `375x812`):**
  - Đồng hồ chạy đúng, Open-Meteo gọi 1 lần `200 OK`, ghi `home_weather_cache` vào `localStorage`.
  - Reload `F5` không phát sinh thêm request tới Open-Meteo; bấm nút `Làm mới dữ liệu` gọi lại Open-Meteo đúng kỳ vọng.
  - Responsive desktop/mobile gọn; chỉ có lỗi 404 `/_vercel/insights/script.js` do chạy local ngoài môi trường Vercel.
- **`/vi/demo/donation` (desktop & mobile):** Banner, avatar và ảnh VietQR hiển thị sắc nét.
- **`/vi/dang-nhap`:** Khi backend `8001` tắt, xác nhận React Query chỉ retry đúng `2` lần (`3` attempt tổng) theo `shouldRetryQuery`. (`/vi/truyen` tự redirect sang `/vi/dang-nhap` do yêu cầu đăng nhập.)

---

## 3. Tài liệu ĐÃ CẬP NHẬT

- `docs/common-catalog.md` (xóa `server-api.ts`, thêm `usePageVisibility`, cập nhật `createQueryClient` & `NotificationBell`).
- `docs/guides/notification-setup.md` (`IDLE_RECHECK_SECONDS = 24 giờ`, chuông `15p`/`30p`).
- `docs/guides/deployment.md` (lịch ngoài: Health check `10 phút`, Workspace `tick` `15 phút`, `dispatch-due` qua QStash theo sự kiện; gộp lại đoạn mô tả cleanup cron bị tách dòng trước đó).
- `docs/features/web-push.md`, `docs/features/attachment-visibility.md`.
- `docs/modules/system/README.md`, `docs/modules/utilities/README.md`, `docs/modules/workspace/README.md`, `docs/modules/home/README.md`.
- `docs/architecture/infrastructure.md` (cập nhật mục `3.1`–`3.4` và ghi chú Workspace Cron theo thông số mới).

---

## 4. Việc CÒN DỞ — Làm tiếp ở phiên sau

1. **Kiểm tra Playwright khi bật đồng thời Backend (`8001`) + Frontend (`3001`):**
   - Lưu ý: `frontend/.next` đang chứa bản production build (`pnpm build`); nếu muốn chạy dev server bình thường thì khởi động lại bằng `scripts/dev.bat`.
   - Mở `/vi/dang-nhap` xác nhận `GET /api/v1/system/settings/public` trả `200 OK`, `0` lỗi console API.
   - Cuộn `/vi/demo/donation` (hoặc trang Donate công khai có `pageId` thật trong DB local) kiểm tra chuyển tab `Bảng Vinh danh` / `Ủng hộ gần đây` và hành vi dừng polling khi ẩn tab (`visibilityState === "hidden"`).
   - Đăng nhập Portal/Admin kiểm tra `NotificationBell` (`useUnreadCount` `15p`/`30p`), `usePushRegistration` (`system_push_device_sync` `24h` trong `localStorage`) và `/vi/truyen` (kiểm `<Image unoptimized />` tải ảnh bìa/avatar).
2. **Hoàn thiện `docs/audit/infrastructure-free-tier-audit.md`:**
   - Bổ sung mục đối chiếu sau tối ưu (`§13`) kèm bảng ngân sách 31 ngày tính lại cho 3 kịch bản (`Idle`, `Normal Personal`, `Maximum Personal`) gắn nhãn rõ `[VERIFIED]` / `[CALCULATED]` / `[ESTIMATED]` / `[UNKNOWN]`.
   - Vẫn giữ đánh dấu `[UNKNOWN]` cho cấu hình ngoài repo chưa xác nhận (cơ chế/giờ chạy DB backup hằng ngày, Neon Autoscaling/Branch phụ, biến ENV thật `REDIS_URL`/`QSTASH_TOKEN`/`CLOUDFLARE_API_TOKEN` trên production).
3. **Kiểm tra format Markdown & hoàn tất báo cáo cuối:**
   - Chạy `pnpm --dir frontend exec prettier --check` cho các file `docs/*.md` đã sửa.
   - Xuất báo cáo tổng kết 12 mục (chỉ commit/push khi người dùng yêu cầu).
