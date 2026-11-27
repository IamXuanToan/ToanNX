# Kết quả: tối ưu hệ thống trên hạ tầng free

Ngày: 2026-11-22 · Plan: [plans/2026/11/22/2026-11-22-free-tier-optimization.md](../plans/2026/11/22/2026-11-22-free-tier-optimization.md) ·
Nguyên nhân gốc: [2026-11-22-login-performance.md](2026-11-22-login-performance.md)

## 1. Đã làm

### Login và gửi thông báo (nguyên nhân 23 giây)

| Thay đổi | File |
| --- | --- |
| `notify` chỉ ghi outbox; **request không bao giờ gọi FCM/SMTP/Telegram**. Sau commit đá việc gửi **một lần** cho cả request | `notification_service.py` |
| `NotificationKickService`: mốc Redis `notification:next_due` + tin QStash gọi lại endpoint dispatch (hẹn trễ cho lần thử lại theo lùi dần) | `notification_kick_service.py` (mới) |
| `QstashClient`: đăng tin (timeout 1 giây, lỗi không ném) và kiểm `Upstash-Signature` (JWT HS256, 2 khóa, `sub`, băm body) | `qstash_client.py` (mới) |
| Endpoint dispatch nhận QStash (chữ ký → luôn gửi) hoặc cron (`CRON_SECRET` → mốc chưa tới thì **0 query DB**); khai webhook `system.notification_dispatch` | `notification_dispatch_view.py`, `module.py` |
| Cảnh báo "gửi thất bại" không còn gửi lồng nhau trong request | `notification_service._send_and_alert` |
| FCM: làm mới access token Google có timeout 3 giây (trước là 120 giây); lỗi Google Auth là lỗi tạm | `fcm_client.py` |
| Telegram: token không giải mã được hoặc 401/404 → **tắt bot**, một bản `FAILED`; thông báo sau không tạo bản gửi Telegram | `telegram_bot_service.py`, `notification_preference_service.py` |
| Email theo mẫu gửi đồng bộ (`EMAIL_ASYNC=False`), `EMAIL_TIMEOUT=5` | `settings.py` |
| Đo thời gian login: `auth.login steps rate_limit=.. authenticate=.. session=.. notify=.. commit_kick=.. profile=.. total=..` | `auth_service.py`, `core/logging/step_timer.py` (mới) |
| Log mỗi lần gửi: `notification.send delivery=.. channel=.. status=.. error=.. elapsed=..` (không email, chat id, token) | `notification_dispatcher.py` |
| `DB_CONNECT_TIMEOUT=10`: không chờ vô hạn khi Neon thức hoặc mạng lỗi | `settings.py` |
| Sửa vi phạm rule: `CookieJwtAuthentication` tạo `AuthSessionService` ở `__init__` | `cookie_jwt_authentication.py` |

### Redis (Upstash) — không đánh thức Neon

| Thay đổi | File |
| --- | --- |
| Common `CacheService`: Redis chỉ để tăng tốc; trống hoặc lỗi → như cache miss, tạm ngắt 30 giây, không ném lỗi | `core/cache/cache_service.py` (mới) |
| Rate limit đếm bằng Redis (`INCR`, `EXPIRE` lần đầu), lỗi thì về bucket PostgreSQL như cũ | `rate_limit_service.py` |
| Cache link rút gọn công khai (10 phút; slug không tồn tại 60 giây) và trang tùy chỉnh **đã xuất bản**. Link có mật khẩu không lưu mã băm hay URL đích; mở khóa luôn kiểm DB | `short_link_service.py`, `page_service.py` |
| `CoreCrudService.public_cache_namespace`: ghi link/trang/đường dẫn/QR tăng version sau commit, nên cache cũ hết hiệu lực ngay | `core_crud_service.py`, các service tiện ích |

### Dữ liệu và frontend

| Thay đổi | File |
| --- | --- |
| R2: file công khai `Cache-Control: public, max-age=31536000, immutable` (khóa UUID mới mỗi lần thay); riêng tư `private, no-store` | `r2_storage.py`, `r2_private_storage.py` |
| Cảnh báo dung lượng database từ 80% của `DATABASE_MAX_BYTES` (1 GB), chạy trong cron dọn dẹp hằng ngày | `database_usage_service.py` (mới), task `check_database_size` |
| Chuông thông báo: có push thì hỏi lại mỗi 15 phút, không push thì 6 phút (trước là 60 giây — để tab mở cả ngày thì Neon không bao giờ ngủ); quay lại tab vẫn tải mới | `use-unread-count.ts`, `use-notification-bell.ts` |
| Trình sửa ảnh (`react-easy-crop`) nạp lười, chỉ tải khi bấm Sửa ảnh | `attachment-image-editor-lazy.tsx` (mới) |
| `requirements.txt` sinh lại: **trước đó thiếu `google-auth` và `cryptography`**, thêm `redis` | `requirements.txt`, `pyproject.toml`, `uv.lock` |

### Env và tài liệu

- Env backend (`.env.example`, `.env`, `.env.local`): thêm `REDIS_URL`, `QSTASH_URL`, `QSTASH_TOKEN`,
  `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` (để trống), `DB_CONNECT_TIMEOUT=10`,
  `DATABASE_MAX_BYTES=1073741824`; bỏ `NOTIFICATION_DISPATCH_BUDGET_SECONDS`.
- Rule: `docs/rules/backend.md` §9, `CLAUDE.md` và `AGENTS.md` (hai quy tắc cốt lõi mới, đã khớp nhau).
- Docs: `common-catalog.md`, `architecture/infrastructure.md`, `guides/notification-setup.md`, `guides/deployment.md`,
  `features/web-push.md`, `modules/system/README.md`, `modules/utilities/README.md`.

## 2. Kiểm thử

- Backend: `ruff format/check`, `mypy .` sạch; `spectacular --validate --fail-on-warn` sạch.
- `pytest app/core app/system app/utilities` → **804 passed**, cộng `finance/tests/test_sepay_webhook_api.py` đạt.
  Chạy trên PostgreSQL local với `--reuse-db`.
- Test mới: `test_cache_service.py`, `test_step_timer.py`, `test_rate_limit_service.py`, `test_qstash_client.py`,
  `test_notification_kick_service.py`, `test_fcm_client.py`, `test_database_usage_service.py`, cộng thêm ca trong
  `test_login_api.py` (login không gọi provider, chỉ đá một lần), `test_notification_dispatch_api.py` (cron 0 query,
  chữ ký QStash), `test_telegram_bot_api.py` (bot hỏng token bị tắt), `test_short_link_resolve_api.py` và
  `test_page_public_api.py` (cache 0 query, làm mới khi sửa, link khóa không lộ băm), `test_r2_storage.py`.
- Frontend: prettier, eslint, `pnpm typecheck` sạch; Vitest `one-unit-per-file`, `module-registry`,
  `api-contract`, `messages` → đạt.
- **Chưa kiểm trên production và chưa thử trong trình duyệt thật.** Cần deploy rồi xem log `auth.login steps`.

## 3. Việc bạn cần làm trên dashboard

1. **Region**: xem region của Neon; đặt Vercel → Settings → Functions → Region của **cả hai project** trùng vùng đó
   (Neon `aws-ap-southeast-1` ↔ `sin1`).
2. **Upstash Redis**: Vercel → project backend → Storage → Upstash for Redis → Free, **cùng region** → kết nối.
   Kiểm có biến `REDIS_URL`.
3. **Upstash QStash**: Vercel → project backend → Storage → Upstash QStash → kết nối (tạo 4 biến `QSTASH_*`).
4. **Env Vercel backend**: `EMAIL_ASYNC=False`, `EMAIL_TIMEOUT=5`, `DB_CONNECT_TIMEOUT=10`; xóa
   `NOTIFICATION_DISPATCH_BUDGET_SECONDS`; `DATABASE_URL` dùng host `-pooler`.
5. **cron-job.org**: đổi job dispatch thành **mỗi 10 phút** (đang ghi 1–5 phút, sẽ giữ Neon thức suốt).
6. **`DJANGO_SECRET_KEY`**: nếu đã đổi so với lúc lưu token thì nhập lại token bot Telegram (bot đã tự tắt) và
   token SePay. Không đổi lại secret nếu không chắc, vì sẽ đăng xuất mọi phiên.
7. Deploy lại backend và frontend, đăng nhập thử, xem log Vercel có dòng `auth.login steps ... total=...ms`, và Hệ
   thống → Nhật ký thông báo có bản `SENT` sau vài giây.

## 4. Chưa làm (còn trong plan)

- FE: header `Cache-Control s-maxage` cho trang công khai qua CDN Vercel, chỉnh `staleTime` theo loại dữ liệu,
  đo Lighthouse/Speed Insights trước và sau.
- Header `Server-Timing` và màn "Hạn mức" trong Hệ thống (số lệnh Redis, dung lượng DB/R2).
- `DB_STATEMENT_TIMEOUT_MS` được đọc trong settings nhưng **không được áp dụng ở đâu**. Muốn bật thì cần thử với
  pooler Neon (tham số `options` lúc kết nối có thể không qua được PgBouncer).
