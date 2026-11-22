# Plan: tối ưu toàn hệ thống trên hạ tầng free

Ngày: 2026-11-22 · Trạng thái: **giai đoạn 0–3 đã làm (backend), giai đoạn 4 làm một phần, giai đoạn 5 chưa làm** — xem
[reports/2026-11-22-free-tier-optimization-result.md](../reports/2026-11-22-free-tier-optimization-result.md)

Nền tảng: [architecture/infrastructure.md](../architecture/infrastructure.md) (giới hạn và ngân sách).
Thay thế: [reports/2026-11-22-background-jobs-plan.md](../reports/2026-11-22-background-jobs-plan.md).
Nguyên nhân gốc: [reports/2026-11-22-login-performance.md](../reports/2026-11-22-login-performance.md).

## Mục tiêu

| Chỉ số | Hiện tại | Mục tiêu |
| --- | --- | --- |
| Login (production) | ~23 giây, FE timeout ở 15 giây | < 1,5 giây khi ấm; < 4 giây khi khởi động nguội |
| Mở link rút gọn / trang tùy chỉnh khi cache còn | Mỗi lượt query và ghi Neon | Không chạm Neon; < 300ms tại BE |
| Neon CU-giờ/tháng | Có nguy cơ vượt 100 (bộ hẹn giờ mỗi 1–5 phút giữ DB thức suốt) | < 60 |
| Upstash Redis | Chưa dùng | < 100.000 lệnh/tháng (20% hạn mức) |
| Vercel Active CPU | Chưa đo | < 2 giờ/tháng (50% hạn mức) |
| Thông báo push/email/Telegram | Gửi trong request | Tới trong vài giây (QStash) hoặc ≤ 10 phút (lưới an toàn) |

## Nguyên tắc

1. **Request không gọi dịch vụ ngoài để gửi thông báo.** Chỉ ghi outbox.
2. **Lượt khách không chạm DB khi cache còn hiệu lực.** Bộ hẹn giờ không query DB khi không có việc.
3. **Redis chỉ để tăng tốc.** Redis lỗi hoặc hết lệnh thì tự dùng dự phòng (PostgreSQL hoặc bộ nhớ process),
   không bao giờ trả 500.
4. Không đổi nghiệp vụ và bảo mật: vẫn kiểm phiên mỗi request, vẫn rate limit, vẫn retry thông báo. Không tăng
   timeout để che lỗi.
5. Phụ thuộc mới phải được duyệt: `redis` (Python, giai đoạn 2). QStash không cần thư viện, gọi HTTP bằng
   `requests` đã có.

---

## Giai đoạn 0. Đo trước khi sửa (nửa ngày)

| Việc | Chi tiết |
| --- | --- |
| Common `StepTimer` | `app/core/logging/step_timer.py`. Ghi một dòng log `steps a=..ms b=..ms total=..ms`, `request_id` tự gắn qua `request_context_filter`. Cập nhật `docs/common-catalog.md` |
| Đo login | Các bước rate_limit, authenticate, session, notify, commit, profile |
| Đo dispatcher | Mỗi bản: `channel`, `status`, `error_code`, `elapsed_ms`, `delivery_id`. Không log email, chat id, token |
| Header `Server-Timing` | Thêm vào response khi `DEBUG` hoặc header nội bộ, để xem trong DevTools |
| Region | Xem region Neon (Console → Project → Region). Đặt Vercel Functions Region của **cả hai project** trùng Neon. Tạo Upstash cùng region |
| Neon | Compute cố định 0,25 CU; dùng host `-pooler` cho runtime |

Kiểm thử: `core/tests/test_step_timer.py` (không log dữ liệu nhạy cảm, đúng định dạng).

## Giai đoạn 1. Login nhanh, gửi thông báo ngoài request (1 ngày)

| Việc | File | Chi tiết |
| --- | --- | --- |
| Bỏ gửi inline | `notification_service.py` | `notify` chỉ ghi `Notification` và `NotificationDelivery(PENDING)`; bỏ `on_commit → dispatch_ids`. Sau commit gọi `NotificationKickService.kick()` (giai đoạn 3); trước khi có giai đoạn 3 thì không làm gì |
| Không gửi lồng | `notification_service._send_and_alert` | Cảnh báo `delivery_failed` chỉ ghi outbox |
| FCM không treo | `fcm_client.py` | `credentials.refresh` dùng `requests.Session` có timeout 3 giây |
| Telegram hỏng token | `notification_dispatcher._telegram`, `telegram_bot_service` | Giải mã lỗi hoặc 401/404 → bot `is_active=False`, bản gửi `SKIPPED`, cảnh báo một lần |
| Email theo mẫu | `.env` production | `EMAIL_ASYNC=False`, `EMAIL_TIMEOUT=5` (thread nền không an toàn trên Vercel) |
| Secret | Vercel BE | Kiểm `DJANGO_SECRET_KEY`; nhập lại token Telegram và SePay nếu giải mã lỗi |
| FE | `login` view | Lỗi `TIMEOUT` hiện thông báo riêng, giữ 15 giây |
| Vi phạm rule đã thấy | `cookie_jwt_authentication.py` | Đang gọi `AuthSessionService()` trong method; chuyển sang tạo ở `__init__` |

Env đổi: bỏ hoặc đặt 0 cho `NOTIFICATION_DISPATCH_BUDGET_SECONDS` (chỉ cron dùng ngân sách của nó). Cập nhật
`.env.example` và `deployment.md`.

Kiểm thử: `test_login_api.py` (không gọi `NotificationDispatcher.send`, có outbox `PENDING`),
`test_notification_service.py`, `test_notification_dispatcher.py`, `test_fcm_client.py`.

Tài liệu: `docs/features/web-push.md`, `docs/guides/notification-setup.md`, `docs/modules/system/README.md`,
`docs/rules/backend.md` (thêm nguyên tắc 1), cùng `CLAUDE.md` và `AGENTS.md`.

## Giai đoạn 2. Upstash Redis: cache + rate limit (1–1,5 ngày, cần duyệt thư viện `redis`)

### 2.1 Kết nối

- Vercel → project **BE** → Storage → Upstash for Redis → tạo database **cùng region**, gói Free. Integration tự
  thêm `REDIS_URL` và các biến `KV_*` vào project. Backend chỉ đọc `REDIS_URL` (TCP, `rediss://`).
- `settings.py`: có `REDIS_URL` thì `CACHES["default"]` dùng `django.core.cache.backends.redis.RedisCache` với
  `socket_connect_timeout=1`, `socket_timeout=1`, `retry_on_timeout=False`. Trống thì dùng `LocMemCache`.
- Local và pytest: `REDIS_URL` trống. `conftest.py` ép trống, giống cách đang tắt R2 và Firebase.
- Hai biến `KV_REST_API_*` không dùng (phía FE không cần Redis).

### 2.2 Common `CacheService` (`app/core/cache/`)

- `get_or_set(key, ttl, loader)`, `delete(*keys)`, `incr_window(key, ttl)`.
- **Bọc mọi lỗi Redis**: log `cache.unavailable` (có giới hạn tần suất log), trả về như cache miss.
- Khóa: `<module>:<resource>:<id>:v1`, không có tiền tố tên dự án; luôn có TTL.
- Cập nhật `docs/common-catalog.md`.

### 2.3 Rate limit qua Redis

- `RateLimitService.hit` dùng `INCR`; chỉ gọi `EXPIRE` khi kết quả là 1, nên trung bình khoảng 1 lệnh mỗi lượt.
  Redis lỗi thì quay về `RateLimitBucketRepository.increment` (PostgreSQL) như hiện tại.
- `reset`: `DEL`.
- Hành vi không đổi: cùng giới hạn, cùng cửa sổ, cùng mã lỗi `RATE_LIMITED`, cùng `Retry-After`.
- Lợi ích: lượt khách không còn **ghi** Neon, nên không đánh thức DB.

### 2.4 Cache công khai

| Dữ liệu | Khóa | TTL | Xóa khi |
| --- | --- | --- | --- |
| Link rút gọn công khai (`get_public_link`) | `utilities:short_link:<slug>:v1` | 1 giờ | Tạo, sửa, xóa, đổi trạng thái, bulk; `expires_at` sớm hơn TTL thì TTL = thời gian còn lại |
| Trang tùy chỉnh công khai (`get_public`) | `utilities:page:<segment>:<slug>:v1` | 1 giờ | Lưu, đổi đường dẫn, xuất bản, gỡ, xóa |
| Tỷ giá công khai (nếu trang công khai dùng) | `system:exchange_rate:<date>:v1` | 6 giờ | Khi ghi tỷ giá |

- Chỉ cache dữ liệu **công khai**. Link có mật khẩu chỉ cache trạng thái và metadata, **không** cache URL đích;
  `unlock` vẫn kiểm mật khẩu ở DB. Trang riêng tư hoặc cần `viewer` thì không cache.
- Xóa cache nằm trong service (sau commit, `transaction.on_commit`), không nằm trong view.

### 2.5 Ngân sách lệnh (đối chiếu infrastructure.md §3.3)

Ước lượng 40.000–95.000 lệnh/tháng. Theo dõi hằng tuần; quá 300.000 thì tăng TTL hoặc giảm tần suất bộ hẹn giờ.

Kiểm thử: `core/tests/test_cache_service.py` (Redis lỗi → miss, không ném), `test_rate_limit_service.py` (Redis
và dự phòng DB cho cùng kết quả), `test_short_link_resolve_api.py` và `test_page_public_api.py` (lần 2 không
query DB: `django_assert_num_queries(0)` cho phần service; xóa cache khi sửa).

## Giai đoạn 3. Gửi thông báo ngầm không đánh thức Neon (1 ngày)

### 3.1 Kích hoạt tức thì bằng QStash (khuyên dùng)

- Sau commit, `NotificationKickService.kick()` gửi **một** tin QStash, timeout 1 giây, lỗi thì bỏ qua. Đích là
  `POST /api/v1/system/notifications/dispatch` kèm chữ ký QStash. Endpoint kiểm chữ ký
  (`Upstash-Signature`, HMAC với signing key). Khai trong `ModuleDescriptor.callbacks`, dùng `build_backend_url`.
- Gom tin: một request tạo nhiều thông báo chỉ gửi một tin (dùng `Upstash-Deduplication-Id` theo request id).
- Thử lại: dispatcher ghi `next_attempt_at` như cũ. Bản cần thử lại có thể gửi tin QStash có `Upstash-Delay`
  bằng thời gian lùi (tối đa 7 ngày theo gói free).
- Ngân sách: mỗi ngày vài chục tin, dưới 5% hạn mức 1.000 tin/ngày.
- Env mới (thêm lúc làm giai đoạn này): `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`.
  Integration Upstash QStash của Vercel tự tạo các biến này.

### 3.2 Lưới an toàn: cron-job.org mỗi 10 phút + cờ Redis

- Khóa Redis `notification:next_due` lưu mốc sớm nhất có bản cần gửi. `notify` và `_record` cập nhật khóa này
  (lấy giá trị nhỏ hơn). Bộ hẹn giờ đọc nó trước: chưa tới giờ thì trả `204` ngay, **không mở kết nối DB**. Phải
  có test `django_assert_num_queries(0)`.
- Khóa mất (Redis reset) thì coi như có việc: query DB một lần rồi đặt lại khóa.
- Ngân sách: 4.300 lượt gọi Vercel và 4.300 lệnh Redis mỗi tháng; Neon chỉ thức khi có việc thật.
- Sửa hướng dẫn trong `notification-setup.md` (hiện ghi "mỗi 1–5 phút", kiểu này giữ Neon thức suốt).

Không dùng QStash thì đặt cron-job.org mỗi 1–2 phút (vẫn qua cờ Redis), thông báo trễ tối đa 2 phút.

Kiểm thử: `test_notification_dispatch_api.py` (chữ ký sai → 401; cờ chưa tới hạn → 0 query; có việc → gửi),
`test_notification_kick_service.py` (QStash lỗi không ảnh hưởng nghiệp vụ).

## Giai đoạn 4. Frontend mượt hơn (1–2 ngày)

Trước khi làm, đọc `frontend/node_modules/next/dist/docs/` (Next 16 có thay đổi về cache).

| Việc | Chi tiết |
| --- | --- |
| Cùng region | FE function cùng region với BE; server component gọi `/api/v1` sang BE không phải đi vòng xa |
| Trang công khai | `/s/[slug]` và `page-view` đang `force-dynamic` vì cần header (IP cho rate limit). Giữ dynamic, dựa vào cache Redis ở BE (giai đoạn 2). Đánh giá thêm Cache Components của Next 16 cho phần nội dung không phụ thuộc người xem |
| Header cache | Trang công khai không đăng nhập: `Cache-Control: public, s-maxage=60, stale-while-revalidate=600` để CDN Vercel trả lượt lặp mà không gọi function. Chỉ áp khi chắc chắn response không chứa dữ liệu theo người xem |
| React Query | `staleTime` hiện 30 giây. Dữ liệu ít đổi (danh mục, quyền, cài đặt, tiền tệ) để 5–10 phút. Tắt `refetchOnWindowFocus` cho danh sách lớn |
| Ảnh | Ảnh R2 đã nén khi tải lên: cân nhắc `unoptimized` cho ảnh `media.toannx.com` nếu Usage → Image Optimization gần hạn mức Hobby. Ảnh công khai đặt `sizes` đúng để không tải bản quá lớn |
| Bundle trang quản trị | Tải lười các phần nặng: Tiptap editor, `react-easy-crop`, biểu đồ, Firebase messaging (chỉ nạp khi bật push) |
| Phiên | Single-flight refresh đã có; kiểm để không gọi `/auth/me` thừa khi chuyển trang |

Kiểm thử: Vitest cho cấu hình query client; Lighthouse và Vercel Speed Insights (gói free) trước và sau, ghi số
vào báo cáo; E2E chỉ chạy spec liên quan (`auth.spec.ts`, spec link rút gọn).

## Giai đoạn 5. Bảo vệ hạn mức dữ liệu (nửa ngày)

| Việc | Chi tiết |
| --- | --- |
| Cảnh báo dung lượng Neon | Cleanup hằng ngày đọc `pg_database_size`; ≥ 80% của 1 GB thì phát sự kiện cảnh báo dung lượng (như R2) |
| Dữ liệu tăng dần | Rà retention của journal, phiên hết hạn, outbox, bucket rate limit (bảng bucket gần như rỗng sau giai đoạn 2) |
| R2 | Upload file public gắn `Cache-Control: public, max-age=31536000, immutable`; kiểm `media.toannx.com` đi qua cache của Cloudflare |
| Trang Hệ thống | Một màn "Hạn mức": dung lượng DB, dung lượng R2, số lệnh Redis tháng này (nếu đọc được từ API Upstash) |

## Giai đoạn 6. Vận hành

- Checklist hằng tuần ở [infrastructure.md §6](../architecture/infrastructure.md#6-checklist-theo-dõi-hằng-tuần).
- Vercel Cron (1 lần/ngày) giữ việc dọn dẹp; cron-job.org mỗi 10 phút là lưới an toàn cho thông báo.
- Sau mỗi giai đoạn: chạy test liên quan, ghi số đo trước và sau vào `docs/reports/`.

## Thứ tự và ước lượng

| # | Giai đoạn | Phụ thuộc | Ước lượng | Cần duyệt |
| --- | --- | --- | --- | --- |
| 0 | Đo, region | — | 0,5 ngày | — |
| 1 | Login và thông báo ngoài request | 0 | 1 ngày | — |
| 2 | Redis cache + rate limit | 1 | 1–1,5 ngày | Thư viện `redis` |
| 3 | QStash + lưới an toàn | 1, 2 | 1 ngày | Dùng QStash |
| 4 | Frontend | 0 | 1–2 ngày | — |
| 5 | Bảo vệ hạn mức | 2 | 0,5 ngày | — |

Giai đoạn 1 tự nó đã sửa được lỗi login 23 giây; các giai đoạn sau giữ hệ thống nằm trong hạn mức free.
