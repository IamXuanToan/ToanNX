# Audit Infrastructure — Free Tier Optimization (ToanNX)

> **Phạm vi & Nguyên tắc kiểm toán:** Báo cáo chỉ đọc, không sửa mã nguồn hay cấu hình, không chạy load test production, không hiển thị bí mật. Dành riêng cho hệ thống cá nhân một quản trị viên với mục tiêu duy trì ổn định lâu dài trên gói miễn phí (0 VND/tháng), tối ưu Scale-to-Zero cho Neon và bảo vệ ngưỡng an toàn 80%.
>
> **Nhãn phân loại bằng chứng sử dụng xuyên suốt:**
> - `[VERIFIED]` — Xác minh trực tiếp từ source code hoặc tài liệu kiến trúc hiện hành trong repo.
> - `[CALCULATED]` — Tính toán đại số trực tiếp từ công thức và thông số `[VERIFIED]` / số liệu hiện trạng.
> - `[ESTIMATED]` — Ước lượng theo kịch bản vận hành (nêu rõ giả định định lượng).
> - `[UNKNOWN]` — Cấu hình thực tế nằm ngoài source code (Vercel/Neon/Upstash/Cloudflare dashboard, `cron-job.org`, script backup, biến ENV production) cần quản trị viên xác nhận thêm.

---

## Tóm tắt điều hành & Đối chiếu hiện trạng Neon

- **Số liệu hiện trạng quản trị viên cung cấp (~12 ngày vận hành):** Neon đã tiêu thụ **`13,08 CU-hours`**, **`206,77 MB` storage**, **`0,2 GB` network transfer**; Health check chạy **`1 phút/lần`**; Database backup chạy **`1 ngày/lần`**.
- **Đối chiếu toán học với Neon (`0,25 CU` cố định, tự ngủ sau `5 phút` không có truy vấn — `[VERIFIED]` tại `docs/architecture/infrastructure.md:44, 88`):**
  - `[CALCULATED]` Lượng compute đã chạy trong ~12 ngày ở mức `0,25 CU` (nếu autoscaling cố định 0,25 CU `[UNKNOWN]`):
    $$\text{Active compute hours} = \frac{13,08\text{ CU-hours}}{0,25\text{ CU}} = 52,32\text{ giờ} \approx 4,36\text{ giờ/ngày} \approx 261,6\text{ phút/ngày}\ (\text{tức } \sim 18,2\%\text{ thời gian trong ngày})$$
  - `[VERIFIED]` + `[CALCULATED]` Nếu Health check `1 phút/lần` gọi vào `/api/v1/system/health/ready` (`ReadinessView` chạy `SELECT 1`), Neon **không bao giờ ngủ** (`1 phút < 5 phút` auto-suspend) → tốn **`6,00 CU-hours/ngày`**, tức **`72,00 CU-hours` trong 12 ngày** và **`186,00 CU-hours/tháng (186% quota)`**. Vì thực tế chỉ mất `13,08 CU-hours` sau ~12 ngày, khả năng cao nhất (`[CALCULATED]` + `[UNKNOWN]`) là:
    1. Health check `1 phút/lần` đang trỏ đúng vào **`GET /api/v1/system/health`** (`HealthView`: 0 SQL, 0 Redis), còn `~4,36 giờ/ngày` compute phát sinh từ tổ hợp: tab trình duyệt Admin/Portal mở nhiều giờ/ngày (`useUnreadCount` poll `6–15 phút` + `auth/refresh` mỗi `10 phút`), thao tác CRUD/build/deploy (`python manage.py migrate --noinput`), cron/backup đánh thức Neon, hoặc `REDIS_URL`/cron Workspace bị lệch chu kỳ; **HOẶC**
    2. Monitor `/health/ready` chỉ mới bật một phần kỳ (~2 ngày gần nhất), hoặc kích thước compute Neon khác `0,25 CU`.
- **Các điểm rò rỉ tài nguyên lớn nhất phát hiện trong source code (`[VERIFIED]`):**
  1. **Frontend Donation Public Feed/Leaderboard poll `20 giây` / `30 giây` (`donation-public-feed.tsx:151, 186`):** Cả 2 endpoint công khai `/utilities/pages/{id}/donations/feed` và `/leaderboard` **không có Redis cache và không có `Cache-Control`**, đánh thẳng PostgreSQL mỗi 20–30 giây khi khách (hoặc chính chủ site) mở trang Donate.
  2. **Mâu thuẫn cấu hình Cron Workspace giữa tài liệu triển khai và module (`docs/guides/deployment.md:50` vs `app/workspace/module.py:159-175`):** `deployment.md` hướng dẫn `cron-job.org` gọi `POST /workspace/cron/tick` mỗi **5 phút** và `POST /workspace/cron/dispatch-due` mỗi **15 phút**. Trong code, `/cron/dispatch-due` truyền **`force_w4=True` (`workspace_cron_dispatch_due_view.py:35`)**, bỏ qua kiểm tra Redis và **chạm Neon 100% mỗi lần chạy** (`96 lần/ngày × 5 phút` = giữ Neon thức `~8 giờ/ngày = 62 CU-hours/tháng` nếu cấu hình nhầm theo `deployment.md`!).
  3. **Public Settings chưa cache Redis (`setting_service.py:83-96`, `public_setting_view.py`):** Mỗi lượt mở trang Login / Home / App không có cache server sẽ query PostgreSQL cho `Setting` (`is_public=True`).
  4. **Chuỗi thức Neon của `WorkspaceAlertsCacheService` & `NotificationKickService` (`workspace_alerts_cache_service.py:159, 213`, `notification_kick_service.py:23`):**
     - `NotificationKickService` đặt `IDLE_RECHECK_SECONDS = 6 giờ`: buộc `dispatch_pending` thức DB **`4 lần/ngày`** ngay cả khi không có thông báo nào.
     - `WorkspaceAlertsCacheService.compute_next_due_epoch()` đặt trần `earliest = now + 24 giờ` và tự `qstash.publish(..., /workspace/cron/dispatch-due, delay=delay)`, kéo theo `W4` query toàn bộ `WorkspaceSetting`, `Reminder`, `Asset`, `Subscription` ít nhất **`1 lần/ngày`** kể cả khi rỗng.
  5. **Admin polling + Access JWT ngắn hạn (`use-unread-count.ts:13-29`, `settings.py:265`, `auth_session_service.py:22, 85-91`):** Access JWT hết hạn sau **10 phút** (`600s`). Nếu không bật Push FCM, `useUnreadCount` poll mỗi **6 phút** (> 5 phút sát nút), kết hợp `refetchOnWindowFocus: true` và refresh token rotation (`POST /auth/refresh`) + cập nhật `last_used_at`/`last_activity_at` mỗi `> 1 phút`, giữ Neon thức phần lớn thời gian mở tab.
  6. **Cleanup orphan R2 (`attachment_purge_service.py:66-84`):** Mỗi 03:00 UTC liệt kê toàn bộ cây `attachments/` trên cả 2 bucket R2 (`ListObjectsV2` — Class A) và gọi `get_modified_time` (`HeadObject` — Class B) cho từng file mồ côi.
  7. **Image Optimization Vercel (`novel-card.tsx:50`, `attachment-preview.tsx:44`):** Một số `<Image>` ảnh công khai R2 không gắn `unoptimized`, đi qua `/_next/image` (giới hạn 1.000 source images/tháng trên Hobby) dù R2 đã đi qua `media.toannx.com` với `Cache-Control: immutable`.

---

## Bảng tổng hợp (Summary Table)

| Service | Operation | Frequency | Calls per operation | Calls/day | Calls/month (31d) | Free quota | Usage % (Idle / Normal / Max) | Recommendation | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Vercel Hobby (BE)** | `GET /system/health` (`HealthView`) | `1 phút/lần` (`[UNKNOWN]` path đích) | 1 invocation BE (`0` DB, `0` Redis) | 1.440 | 44.640 | 1.000.000 inv/tháng; 4h Active CPU | 4,5% inv; CPU ~1,2–1,9h `[ESTIMATED]` (do cold start) | Đảm bảo gọi `/system/health`, cân nhắc giảm xuống **3–5 phút** để tiết kiệm Active CPU | `health_view.py:15-31`, `infrastructure.md:43, 67` |
| **Vercel Hobby (BE)** | Cron gửi thông báo `/notifications/dispatch` | `10 phút/lần` (`cron-job.org`) + QStash on-commit | 1 invocation BE + 2–3 Redis cmds | 144 (Idle) / 154 (Normal) | 4.464 / 4.774 / 5.704 | 1.000.000 inv/tháng | 0,45% / 0,48% / 0,57% inv | Giữ 10–15 phút khi có QStash; tăng `IDLE_RECHECK_SECONDS` từ 6h → 24h | `notification_dispatch_view.py:44-61`, `notification-setup.md:53` |
| **Vercel Hobby (BE)** | Cron Workspace `/workspace/cron/tick` | `15 phút/lần` (`module.py:159`) `[UNKNOWN]` (docs khác ghi 5p) | 1 inv BE + W1 Redis + W4 gate | 96 (`[ESTIMATED]` theo 15p) | 2.976 (nếu 5p: 8.928) | 1.000.000 inv/tháng | 0,30% (hoặc 0,89% nếu 5p) | Chuẩn hóa 15–30 phút; sửa `deployment.md` bỏ cron 15p vào `/dispatch-due` | `workspace/module.py:154-166`, `deployment.md:50` |
| **Vercel Hobby (BE)** | Vercel Cron `/system/health/cleanup` | `03:00 UTC` hằng ngày (`0 3 * * *`) | 1 inv BE + 8 cleanup tasks | 1 | 31 | Max 1 cron/ngày; 1M inv | < 0,01% inv | Giữ `0 3 * * *`; giới hạn max scan R2 orphan | `backend/vercel.json:15-19`, `cleanup_view.py:33-50` |
| **Vercel Hobby (BE)** | API CRUD + Auth + Public + Webhook | Theo người dùng & khách | 1 inv BE/req | 0 (Idle) / ~300 (Norm) / ~2.000 (Max) | 0 / ~9.300 / ~62.000 | 1.000.000 inv; 4h CPU | Tổng BE+FE: ~5,2% / ~8% / ~22% inv | Cache `/system/settings/public` & `/donations/feed, leaderboard` | `urls.py`, `infrastructure.md:58-70` |
| **Vercel Hobby (FE)** | Proxy `proxy.ts` + Dynamic SSR (`/s/[slug]`) + Image Opt | Mỗi request trang FE | 1 edge/func inv (+ `/_next/image` nếu có) | ~10 (Idle bot) / ~250 (Norm) / ~1.500 (Max) | ~310 / ~7.750 / ~46.500 | 1.000.000 inv; 1.000 Image Opt | < 5% inv; Image Opt rủi ro nếu đọc nhiều truyện | Gắn `unoptimized` cho ảnh R2 đã ở `media.toannx.com` | `proxy.ts:32-85`, `app/s/[slug]/page.tsx:5`, `novel-card.tsx:50` |
| **Neon PostgreSQL** | Wake episodes (Idle recheck 6h + W1 flush 6h + W4 24h + Cleanup + Backup) | Hỗn hợp (4×6h + 2×ngày + user) | 1 SQL → +5p compute window (trước khi sleep) | Idle: ~0,17–0,23 CUh/d (nếu sạch); Hiện trạng ~1,09 CUh/d | **5,2–7,1 CUh** (sạch) / **~33,8 CUh** (theo đà 12d) / **~28–45 CUh** (Normal) / **~65–85 CUh** (Max) | **100 CU-hours/tháng**; **1 GB** storage; **5 GB** egress | **5,2–33,8%** (Idle sạch vs thực tế 12d); **28–45%** (Normal); **65–85%** (Max) | Bảo đảm `/health` 0 SQL, không cron `/dispatch-due`, bỏ poll 20s Donate, kiểm lịch sử `pg_dump` | `infrastructure.md:44, 72-92`, `settings.py:76-93` |
| **Neon PostgreSQL** | Daily Backup (`pg_dump` `[UNKNOWN]`) | `1 lần/ngày` (`[UNKNOWN]` giờ/cách) | 1 dump (~5–8p thức Neon + transfer) | 1 backup (~17–100 MB egress `[ESTIMATED]`) | 31 (~0,5–3,1 GB egress) | 5 GB egress/tháng; 1 GB storage | Egress ~10–62% (`0,2 GB / 12d` = ~10% nếu tiếp tục đà này) | Xác nhận cách backup; nếu `pg_dump` nén `--compress=9`, tránh backup trùng nhánh hoặc dùng Neon Snapshot | `User input`, `database_usage_service.py` |
| **Upstash Redis** | Rate limit (`incr_window`) + Public cache + Lock W1/W4 + NextDue | Mỗi write/public/cron req | RL: 1–2 cmds; Cache: 2–3; W1(0 mon): 3–4; Dispatch: 2 | ~770–1.550 (Idle) / ~3.000 (Normal) / ~12.000 (Max) | ~24.000–48.000 (Idle) / ~93.000 (Normal) / ~372.000 (Max) | **500.000 cmds/tháng**; 256 MB; 10 GB BW | **~4,8–9,6%** / **~18,6%** / **~74,4%** | Tăng `cron/tick` lên 15–30p; batch/MGET `overlay_redis_state` thay vì loop N `GET` | `cache_service.py`, `workspace_cron_service.py`, `short_link_service.py` |
| **Upstash QStash** | Push `notify.kick` + W4 `dispatch-due` + Telegram AI 1-hop + retries | On-event (`commit` có notification/message/schedule) | 1 publish (retry max 2) | ~1–2 (Idle) / ~25 (Norm) / ~150 (Max) | ~31–62 / ~775 / ~4.650 | **1.000 tin/ngày** | **0,2%** / **2,5%** / **15%** của quota ngày | Bỏ tự hẹn `W4` 24h khi DB không có reminder/digest bật | `qstash_client.py:22-92`, `workspace_alerts_cache_service.py:204-220` |
| **Cloudflare R2** | Storage + Upload (`S3 Put` + 2× REST `usage`) + Cleanup (`List` + `Head`) | Upload theo nhu cầu + Cleanup 1/ngày | Class A: 2 `List` (cleanup) + 1/upload; Class B: 0..N `Head` | ~2–10 Class A; ~0–50 Class B | ~62–300 Class A; ~0–1.500 Class B | 10 GB; **1M Class A**; **10M Class B**; 0 egress | **< 0,1%** ops; Storage tùy file (`206 MB` DB ≠ R2) | Cache `R2UsageService` 5–10p vào Redis; giới hạn `purge_orphans` batch | `r2_storage.py`, `r2_usage_service.py`, `attachment_purge_service.py` |
| **Firebase FCM** | Push Web notification (`HTTP v1`) + Client token check | On notification + mở Admin/Portal | 1 POST `messages:send` (nếu có device) | 0 (Idle) / ~10–20 (Norm) / ~80 (Max) | 0 / ~300–600 / ~2.480 | Miễn phí (Spark FCM) | 0% (miễn phí không giới hạn số lượng tin) | Giữ nguyên; kiểm tránh gọi `pushDeviceService.register()` trùng mỗi lần F5 khi token không đổi | `fcm_client.py:47-74`, `use-push-registration.ts:53-63` |
| **SMTP Provider** | Email OTP/Reset/Notification | On notification kênh EMAIL / Auth | 1 SMTP connection/mail (`timeout=5s`) | 0 / ~2–5 / ~30 | 0 / ~62–150 / ~930 | ~500 thư/ngày (vd Gmail) | 0% / <1% / ~6% quota ngày | Giữ nguyên; tránh bật kênh Email cho sự kiện tần suất cao | `email_service.py`, `settings.py:462-483` |
| **cron-job.org** | Gọi định kỳ `/notifications/dispatch`, `/workspace/cron/tick`, (`/health` `[UNKNOWN]`) | 1p / 10p / 15p `[UNKNOWN]` | 1 HTTP GET/POST | 1.680 (`1440+144+96`) | 52.080 | Miễn phí (hỗ trợ mỗi phút) | Đạt giới hạn gói free | Chỉ giữ tối đa 3 job cần thiết; hợp nhất health check ở mức 3–5 phút | `module.py`, `notification-setup.md:48-57` |
| **xKiro AI / Telegram** | Chat AI Web & Telegram bot webhook/reply | On user prompt / command | 1–3 AI reqs/round (max 3 rounds); 1 TG `sendMessage` | 0 / ~5–15 / ~100 | 0 / ~150–450 / ~3.100 | Tùy provider (`[UNKNOWN]`) | `[UNKNOWN]` | Giữ Slash commands 0-token, `XKIRO_TIMEOUT_SECONDS<=5s`, Redis cooldown | `xkiro_client.py`, `telegram_client.py`, `assistant_service.py` |
| **Open-Meteo / VietQR / Favicon / Umami** | Frontend public widgets & analytics | Khi mở Home / Donate / ShortLink / Public Page | 1 req client-side trực tiếp (0 qua BE/FE server) | 0 / ~15–50 / ~300 | 0 / ~450–1.500 / ~9.000 | Open-Meteo 10k/ngày; Umami 100k/tháng; Vercel Analyt. 50k/tháng | **< 2%** mọi dịch vụ client-side | Chuyển Weather cache từ Zustand in-memory sang `localStorage` (giữ cache qua F5) | `use-weather-widget.ts`, `app-analytics.tsx`, `donation-page-renderer.tsx` |

---

## 1. Technology Inventory

Phân loại toàn bộ công nghệ và tích hợp dựa trên `backend/pyproject.toml`, `backend/config/settings.py`, `frontend/package.json`, `frontend/next.config.ts`, `.github/workflows/ci.yml` và toàn bộ source `backend/app/`, `frontend/src/`.

### 1.1. Công nghệ & Tích hợp đang sử dụng (Active)

| Nhóm | Công nghệ / Thư viện | Vai trò trong ToanNX | Bằng chứng `[VERIFIED]` |
| --- | --- | --- | --- |
| **Runtime & Framework BE** | Python 3.13, Django 6.0.10, DRF 3.18.3, `drf-spectacular` 0.30.0, `django-filter` 26.2, `argon2-cffi` 25.1.0 | Monolith REST API (`/api/v1/*`), WSGI serverless trên Vercel | `backend/pyproject.toml:1-98`, `backend/requirements.txt:1-130`, `backend/vercel.json:1-21` |
| **Runtime & Framework FE** | Next.js 16.4.6 (App Router, `src/proxy.ts`), React 19.3.0, TypeScript, Tailwind CSS 4, `next-intl`, shadcn/ui | SPA/Client-only data fetching (`toannx.com`), đa ngôn ngữ `/vi`, `/en` + `/s/[slug]` | `frontend/package.json:1-82`, `frontend/src/proxy.ts:1-113` |
| **State & Data Fetching FE** | `@tanstack/react-query` 5.107.1, `zustand` | Query caching (`staleTime=30s`), Auth store, Weather cache store | `frontend/src/shares/lib/query-client.ts:1-28`, `frontend/src/modules/home/store/weather-store.ts:114` |
| **Cơ sở dữ liệu** | Neon PostgreSQL (truy cập qua `psycopg` 3.3.9 + `-pooler`, `CONN_MAX_AGE=0`, `CONN_HEALTH_CHECKS=True`) | Nguồn dữ liệu gốc duy nhất, session auth (`sid`), rate limit fallback, outbox notification | `backend/config/settings.py:76-94`, `infrastructure.md:20-23, 136-137` |
| **Cache & Distributed Lock** | Upstash Redis (`redis>=6.0` / `redis==8.1.0`, TLS `rediss://`) qua `CacheService` | Public cache (`short_link`, `page`, `metadata`), rate limit (`INCR`), lock W1/W4 (`SET NX EX`), AI cooldown, Telegram `update_id` dedup | `backend/app/core/cache/cache_service.py:1-182`, `backend/config/settings.py:424` |
| **Hàng đợi bất đồng bộ** | Upstash QStash (`QstashClient`, HTTP `/v2/publish` + verify `Upstash-Signature` JWT) | Gửi 1-hop sau commit: notification dispatch, W4 `dispatch-due` (trễ tới 7 ngày), Telegram AI async | `backend/app/system/services/qstash_client.py:1-124`, `backend/config/settings.py:417-420` |
| **Object Storage & Quota API** | Cloudflare R2 (`boto3` + `django-storages` S3v4 + Cloudflare REST API v4 `R2UsageService`) | 2 bucket (public `media.toannx.com` `immutable` + private signed URL TTL 300s) | `r2_storage.py:1-52`, `r2_private_storage.py:1-26`, `r2_usage_service.py:1-105` |
| **Push Notification** | Firebase Cloud Messaging HTTP v1 (`google-auth` + `firebase` 13.4.0 Web SDK + self-written SW `notification-sw.js`) | Gửi data-only push popup (kèm đăng ký token khi mở Admin/Portal) | `fcm_client.py:1-111`, `firebase-messaging.ts:1-54`, `frontend/public/notification-sw.js:1-135` |
| **Email** | Django SMTP (`EmailMultiAlternatives`, `EMAIL_TIMEOUT=5s`, `EMAIL_ASYNC=False`) | Gửi email reset password, verify email, invitation, notification kênh `EMAIL` | `backend/config/settings.py:462-484`, `email_service.py:1-216` |
| **Cron Schedulers** | Vercel Cron (1 job/ngày) + `cron-job.org` (ngoài repo) | Vercel: `GET /system/health/cleanup` (`0 3 * * *`); ngoài: notify dispatch, workspace tick, health check | `backend/vercel.json:15-19`, `docs/guides/deployment.md:47-55` |
| **Bot & AI** | Telegram Bot API (1 bot chung ENV), xKiro AI API (OpenAI-compatible Multi-Model Fallback) | Cảnh báo & Trợ lý AI 2 chiều (`/start`, DM, Group) + Web AI Assistant | `telegram_bot_service.py:1-144`, `xkiro_client.py:1-188` |
| **Tài chính & Tỷ giá** | SePay (Webhook HMAC-SHA256 + API v2 `userapi.sepay.vn/v2`), Vietcombank JSON API, `napas-qr-python` / `segno` | Đối soát thu nhập, Donate webhook, tỷ giá ngoại tệ theo ngày | `sepay_api_client.py:1-101`, `sepay_webhook_view.py:1-61`, `vietcombank_rate_client.py:1-53` |
| **OAuth 2.0** | Google OAuth, GitHub OAuth | Đăng nhập / liên kết tài khoản mạng xã hội | `oauth_service.py:1-100`, `google_oauth_service.py`, `github_oauth_service.py` |
| **Dịch vụ Client trực tiếp** | Open-Meteo API, VietQR `img.vietqr.io`, Google Favicon V2 (`t2.gstatic.com`), Umami Cloud, Vercel Analytics, Unsplash CDN | Widget thời tiết Home, ảnh VietQR trang Donate, favicon bio-link, đo truy cập trang công khai | `use-weather-widget.ts:128`, `donation-page-renderer.tsx:254`, `bio-link-icon.tsx:147`, `app-analytics.tsx:4, 58` |
| **CI/CD** | GitHub Actions (`ci.yml` trên Postgres 17 + Python/Node/uv/pnpm) | Lint, typecheck, pytest, vitest, `next build`, kiểm lệch OpenAPI schema | `.github/workflows/ci.yml:1-117` |

### 1.2. Dịch vụ Dự phòng (Fallback / Graceful Degradation)

| Cơ chế chính | Cơ chế dự phòng (Fallback) | Hành vi khi kích hoạt | Bằng chứng `[VERIFIED]` |
| --- | --- | --- | --- |
| Upstash Redis (`CacheService`) | PostgreSQL (`RateLimitBucketRepository`, query trực tiếp DB) | Khi `REDIS_URL` trống hoặc lỗi: `_down_until = now + 30s`, rate limit chuyển về DB (`INSERT ... ON CONFLICT`), public cache coi như miss, cron W1/W4/Notification coi như "có việc" và query DB | `cache_service.py:124-136`, `rate_limit_service.py:54-56`, `notification_kick_service.py:57-65` |
| Upstash QStash (`QstashClient`) | Cron ngoài (`cron-job.org`) + Vercel Cleanup Cron (`dispatch_notifications`) | Khi thiếu `QSTASH_TOKEN` hoặc publish lỗi (`timeout 1s`): không ném lỗi, bản tin outbox vẫn nằm ở DB để cron gửi bù | `qstash_client.py:37-92`, `notification_kick_service.py:36-49` |
| Cloudflare R2 Usage API (`R2UsageService`) | PostgreSQL `AttachmentRepository.get_total_storage_size()` | Khi thiếu `CLOUDFLARE_API_TOKEN` hoặc Cloudflare API lỗi/timeout `3s`: cộng tổng dung lượng file `purged_at IS NULL` từ DB | `r2_usage_service.py:48-105`, `attachment_service.py:96-121` |
| xKiro Primary Model | Multi-model fallback (`XKIRO_FALLBACK_MODELS`, max 3 attempts, 120s Redis cooldown) → Slash commands `0 token` | Khi model lỗi 400/402/404/429/5xx/timeout (tối đa 5s/lượt, deadline 20s): đánh dấu cooldown và thử model kế tiếp; 8 lệnh `/today`, `/upcoming`... chạy local `0 token` | `xkiro_client.py:43-188`, `assistant_service.py:99` |
| `DATABASE_URL_UNPOOLED` (khi build) | Fallback sang `DATABASE_URL` trong script build | `DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"` | `docs/guides/deployment.md:103-106`, `backend/build_files.sh:7` |

### 1.3. Chưa sử dụng / Cấu hình chờ (Unused / Standby)

| Hạng mục | Thực trạng trong source | Bằng chứng `[VERIFIED]` |
| --- | --- | --- |
| Cloudflare Web Analytics (`cloudflareinsights.com`) | Xuất hiện trong CSP (`script-src` và `connect-src`) của `frontend/next.config.ts`, **chưa có** thẻ script hoặc SDK nào import trong mã nguồn FE. Có thể chạy nếu bật auto-inject trên Cloudflare Proxy `[UNKNOWN]`. | `frontend/next.config.ts:21, 26`, `app-analytics.tsx:1-67` |
| `FIREBASE_PROJECT_ID` / `TELEGRAM_BOT_TOKEN` / `XKIRO_*` / `GOOGLE_*` / `GITHUB_*` / `CLOUDFLARE_API_TOKEN` | Thiết kế bật/tắt động theo ENV (nếu bỏ trống sẽ ẩn tính năng tương ứng không lỗi). Trạng thái đang bật cụ thể trên Vercel production là `[UNKNOWN]`. | `backend/config/settings.py:398-424, 486-489` |

### 1.4. Đã ngừng sử dụng / Dead Code / Local-Only (Retired)

| Hạng mục | Trạng thái | Ghi chú & Bằng chứng `[VERIFIED]` |
| --- | --- | --- |
| `frontend/src/shares/lib/api/server-api.ts` (`serverApiGet`, `backendFetch`) | **Dead code (Đã ngừng dùng)** | Không có bất kỳ file nào trong `frontend/src/` import; hệ thống đã chuyển 100% sang Client-only React Query (`apiClient`). | `server-api.ts:1-64`, kết quả `git grep` |
| `api.qrserver.com`, `www.google.com`, `icons.duckduckgo.com` trong `next.config.ts` | **Đã ngừng dùng (Legacy)** | Còn khai báo trong `images.remotePatterns` nhưng **0 call site** trong code; đã thay bằng `segno` BE, `img.vietqr.io` và `t2.gstatic.com/faviconV2`. | `frontend/next.config.ts:44, 68, 76`, `bio-link-icon.tsx:147` |
| `poll_telegram_assistant` (`TelegramPollingService`) | **Chỉ dùng ở dev local** | Long-polling `getUpdates` (`timeout=20s`) phục vụ test local không cần ngrok; production dùng webhook `/system/telegram/webhook`. | `telegram_polling_service.py:1-53`, `commands/poll_telegram_assistant.py` |
| `EMAIL_ASYNC=True` (`_email_executor` ThreadPoolExecutor) | **Tắt ở production serverless** | Mặc định `False` vì thread nền trên Vercel Function bị ngắt ngay khi response trả về. | `backend/config/settings.py:483`, `email_service.py:24-26, 93-97` |

---

## 2. External Services

Tổng hợp đầy đủ **17 dịch vụ bên thứ ba** (Server-to-Server + Client-direct + CI/DevOps) và trạng thái:

| # | Dịch vụ | Giao tiếp từ | Mục đích & Endpoint đích | Timeout / Retry trong code | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| 1 | **Vercel (FE & BE)** | Platform Hosting | Chạy Next.js `toannx.com` & Django `@vercel/python` `api.toannx.com` + Vercel Cron + Image Optimization (`/_next/image`) + Vercel Analytics | Max `300s` Fluid compute (`infrastructure.md:43`), FE `apiTimeoutMs=15s` / `uploadTimeoutMs=60s` | Active |
| 2 | **Neon PostgreSQL** | Backend | DB chính qua `-pooler` (`PgBouncer`), `DB_CONN_MAX_AGE=0` | `connect_timeout=10s`, `DB_STATEMENT_TIMEOUT_MS=5000` (`settings.py:76, 82`) | Active |
| 3 | **Upstash Redis** | Backend | Public cache, rate limit, locks, AI cooldown (`rediss://`) | `socket_timeout=1.0s`, `retry_on_timeout=False`, outage mute `30s` (`cache_service.py:21-23, 163-165`) | Active |
| 4 | **Upstash QStash** | Backend ↔ QStash | HTTP `POST /v2/publish/{url}` + Callback signature JWT | `timeout=1.0s`, `Upstash-Retries: 2` (`qstash_client.py:22-24`) | Active |
| 5 | **Cloudflare R2 (+ REST v4)** | Backend + Browser (`media.toannx.com`) | Lưu file S3 API (`boto3`), đọc usage REST v4 (`api.cloudflare.com`) | Usage API `timeout=3.0s` (`r2_usage_service.py:29`) | Active |
| 6 | **Firebase (FCM HTTP v1)** | Backend + Browser (`firebase/*`) | Gửi data-only push (`fcm.googleapis.com`) & cấp token trình duyệt (`firebaseinstallations`, `fcmregistrations`) | BE `NOTIFICATION_PROVIDER_TIMEOUT_SECONDS=3s` (`notification_defaults.py:10`); OAuth `google-auth` có timeout | Active (tùy ENV) |
| 7 | **SMTP Server** | Backend (`EmailMultiAlternatives`) | Gửi email auth & notification | `EMAIL_TIMEOUT=5s` (`settings.py:476`), outbox retry `1/5/15/60/240 phút` (max 5 lần) | Active |
| 8 | **cron-job.org** | External Scheduler → Backend | Đánh thức `/system/notifications/dispatch`, `/workspace/cron/tick` (+ `[UNKNOWN]` `/health`?) | Cấu hình ngoài repo (`[UNKNOWN]`) | Active |
| 9 | **Telegram Bot API** | Backend ↔ `api.telegram.org` | Webhook update + gửi thông báo + Trợ lý AI (`sendMessage`, `getMe`, `setWebhook`) | `TELEGRAM_TIMEOUT_SECONDS=5s` (`notification_defaults.py:27`) | Active |
| 10 | **xKiro AI API** | Backend (`XkiroClient`) | `/chat/completions` OpenAI-compatible multi-model | `<= 5.0s`/lượt (`settings.py:407-409`), deadline `20s`, max 3 models, 120s cooldown | Active |
| 11 | **SePay** | SePay ↔ Backend (`userapi.sepay.vn/v2`) | Webhook biến động số dư (Finance + Donate) & import giao dịch API v2 | `SEPAY_TIMEOUT_SECONDS=10s`, giãn cách `0.35s`/trang, max `50` trang (`sepay_api.py:10-13`) | Active |
| 12 | **Vietcombank JSON API** | Backend (`vietcombank.com.vn/api/exchangerates`) | Lấy tỷ giá chuyển khoản theo ngày (lưu DB cache theo ngày/tiền tệ) | `EXCHANGE_RATE_TIMEOUT_SECONDS=10s`, `0` auto-retry (`vietcombank_rate_client.py:23, 40`) | Active (on-demand) |
| 13 | **Google & GitHub OAuth** | Backend & Browser | OAuth login & link social (`oauth2.googleapis.com`, `github.com`, `api.github.com`) | `timeout=10s` (`google_oauth_service.py:58, 83`, `github_oauth_service.py:59, 85, 110`) | Active (on-demand) |
| 14 | **Open-Meteo** | Browser (`api.open-meteo.com`) | Dự báo thời tiết trang chủ (`useWeatherWidget`) | Không đặt timeout riêng (`fetch` mặc định trình duyệt), Zustand cache 3 phút (mất khi F5) | Active (Client) |
| 15 | **VietQR & Google Favicon V2** | Browser (`img.vietqr.io`, `t2.gstatic.com`) | Render SVG QR Donate & favicon domain trang Bio Link / Short Link | Chạy trực tiếp ở `<Image unoptimized />` phía trình duyệt | Active (Client) |
| 16 | **Umami Cloud & Unsplash** | Browser (`cloud.umami.is`, `images.unsplash.com`) | Analytics trang công khai & ảnh template Demo/Notion | Umami `afterInteractive` ở production (trừ `/quan-tri`, `/ca-nhan`, auth) | Active (Client) |
| 17 | **GitHub Actions** | GitHub CI (`ci.yml`) | Chạy test, lint, typecheck, `api:types` check khi push `develop`/`main` hoặc mở PR | `ci.yml:1-117` | Active (CI/CD) |

*(Ngoài ra còn `SafeHttpClient` khi ping Uptime Monitor hoặc trích xuất link metadata tới URL do người dùng cấu hình — timeout tối đa `5s`, max `1 MB`, chặn SSRF 7 lớp qua `PinnedHttpAdapter`.)*

---

## 3. Automated Request Inventory

Liệt kê toàn bộ lưu lượng tự động / ngầm và điều kiện phát sinh **ngay cả khi không có người dùng thao tác**.

### 3.1. Nhóm tự động phát sinh khi HỆ THỐNG RẢNH (Zero Users / 24/7)

| Tác vụ / Luồng | Endpoint / Hàm | Điều kiện kích hoạt | DB Queries | Redis Commands | External APIs | Khả năng gọi trùng / Đánh thức Neon |
| --- | --- | --- | --- | --- | --- | --- |
| **Health check ngoài** | `GET /api/v1/system/health` (`HealthView`) **HOẶC** `/health/ready` (`ReadinessView`) | Scheduler ngoài **`1 phút/lần`** (`[UNKNOWN]` đích & công cụ) | Nếu `/health`: **0**<br>Nếu `/health/ready`: **1** (`SELECT 1`) | **0** (GET không `@rate_limit` → `BucketThrottle` bỏ qua) | **0** | Nếu gọi `/health/ready` ở 1p/lần → Neon **không bao giờ ngủ (100% thức)**. `[VERIFIED]` |
| **Notification Dispatch Cron** | `POST /api/v1/system/notifications/dispatch` (`NotificationDispatchView`) | `cron-job.org` **10 phút/lần** (`notification-setup.md:53`) + QStash on-commit | Khi Redis mốc còn hạn: **0**.<br>Khi Redis tắt/hết TTL (`6h/lần`): **2–4** (`due_ids`, `next_due_at`, lock+send nếu có) | `1 INCR` (+1 `EXPIRE` cửa sổ mới) cho rate limit (chờ: xem note*) + `1 GET` (`notification:next_due`) [+`1 SET` nếu query DB] | FCM / SMTP / Telegram (chỉ khi có bản `PENDING` đến hạn) | **Lưu ý kỹ thuật `[VERIFIED]`:** `NotificationDispatchView` không gắn `@rate_limit` nhưng dùng `POST`, nên `BucketThrottle` tự áp `CoreRateLimitKey.DEFAULT_WRITE`! Redis vẫn hết **1–2 lệnh rate limit/lần**. Vì `IDLE_RECHECK_SECONDS = 6h`, tự động đánh thức DB **4 lần/ngày** kể cả khi 0 thông báo! |
| **Workspace Cron Tick (W1 + W4)** | `POST /api/v1/workspace/cron/tick` (`WorkspaceCronTickView`) | `cron-job.org` **15–30 phút/lần** (`workspace/module.py:159`) hoặc **5 phút/lần** (`deployment.md:50`) `[UNKNOWN]` | **W1 rảnh (`0` flip, chưa tới 6h flush):** **0** SQL.<br>**W1 tới flush 6h (nếu có monitor):** bulk update + re-sync.<br>**W4 chưa tới `alerts_next_due`:** **0** SQL.<br>**W4 miss cache / hết hạn 24h:** `1` W4 full scan + `1` QStash publish | Rate limit (`@rate_limit` `CRON_TICK`: `1–2` cmds) + W1 lock/unlock (`SET NX EX` + `DEL` = `2` cmds) + `GET monitors:active` + `M×GET monitor_state` + `GET alerts_next_due` | HTTP probe song song (`SafeHttpClient`, max `10` worker, budget `20s`) tới từng target đến hạn; QStash publish nếu W4 re-warm | Có `w1_lock` (`30s`) & `w4_lock` (`30s`) chống trùng song song. Tuy nhiên `compute_next_due_epoch()` gán cứng `earliest = now + 24h` (`workspace_alerts_cache_service.py:159`), tạo chu kỳ tự hẹn QStash mỗi 24h dù không có việc. |
| **Workspace Dispatch Due (W4)** | `POST /api/v1/workspace/cron/dispatch-due` (`WorkspaceCronDispatchDueView`) | Đúng lý do QStash hẹn trễ (`<= 7 ngày`). **Nguy cơ:** nếu admin đặt `cron-job.org` 15 phút/lần theo `deployment.md:50`! | **Luôn chạm DB (`force_w4=True`)**: lock setting, scan `Setting`, `Reminder`, `Asset`, `Subscription`, và `compute_next_due_epoch` + Digest sub-queries | `1–2` cmds rate limit (`CRON_DISPATCH_DUE`) + W4 lock/unlock (`2` cmds) + `SET alerts_next_due` (+ `DEL`/scan monitor nếu digest có section `monitors`) | QStash `publish` hẹn lượt kế tiếp + `flush_kick()` (nếu tạo thông báo) | Có `w4_lock` + `digest_sent` TTL 36h chống trùng. Nhưng vì `force_w4=True` bỏ qua cache Redis, **nếu gọi cron định kỳ 15p sẽ đánh thức Neon `96 lần/ngày`**! `[VERIFIED]` |
| **Daily Cleanup Cron** | `GET /api/v1/system/health/cleanup` (`CleanupView`) | Vercel Cron `0 3 * * *` (**1 lần/ngày** tại `backend/vercel.json:16`) | ~**15–25 queries** across 8 tasks (`rate_limit_bucket`, `auth_session`, `journal_entry`, `attachment`, `notification`, `delivery`, `push_device`, `pg_database_size`, `monitor_incident`, `assistant_*`) + `dispatch_notifications(force=True)` | **0** (GET không `@rate_limit`) | Cloudflare R2 S3: `ListObjectsV2` (2 bucket) + `HeadObject` (orphan files) + `DeleteObject` (nếu có file quá hạn); Email/FCM nếu quota >= 80% | Đánh thức Neon `1 lần/ngày`. R2 `purge_orphans` quét toàn bộ thư mục `attachments/` trên **cả 2 bucket** mỗi ngày. |
| **Database Backup** | `[UNKNOWN]` (ngoài source code) | **`1 ngày/lần`** (theo quản trị viên báo cáo) | Full schema/data dump (`pg_dump` hoặc Neon snapshot `[UNKNOWN]`) | **0** | `[UNKNOWN]` (nơi chạy script/GitHub/local) | Nếu chạy `pg_dump` truyền qua Internet, đánh thức Neon tối thiểu `5 phút + dump time`/ngày và tiêu tốn Neon Network Transfer. |

> *Ghi chú `[VERIFIED]` về `BucketThrottle`:* Tại `bucket_throttle.py:65-66`, mọi method không thuộc `{"GET", "HEAD", "OPTIONS"}` mà không gắn `@rate_limit` đều tự dùng `CoreRateLimitKey.DEFAULT_WRITE`. Các endpoint cron `POST` (`/notifications/dispatch`, `/cron/tick`, `/cron/dispatch-due`) đều qua `BucketThrottle`, tiêu tốn 1–2 lệnh Redis (hoặc `1 INSERT ON CONFLICT` vào Neon nếu Redis tắt!) ngay cả khi cron trả 0 việc.

### 3.2. Nhóm tự động phát sinh khi TRÌNH DUYỆT ĐANG MỞ (Client Idle / Active Tab)

| Cơ chế FE | Hook / Component | Tần suất & Điều kiện | API & Backend tác động | Ghi chú & Bằng chứng `[VERIFIED]` |
| --- | --- | --- | --- | --- |
| **Notification Unread Count Polling** | `useUnreadCount` (`use-unread-count.ts:13-29`) | Tab foreground (`refetchIntervalInBackground: false`) + `refetchOnWindowFocus: true`. **6 phút/lần** khi chưa bật Web Push; **15 phút/lần** khi đã bật Push | `GET /api/v1/system/notifications/unread-count` → `CookieJwtAuthentication` (1 SELECT session+user + 1–2 UPDATE touch nếu `>1p`) + 1 SQL `COUNT` grouped | Ở chu kỳ **6 phút** (khi tắt push), chỉ nhỉnh hơn 5p Neon auto-suspend 1p; cộng thêm **Access JWT hết hạn mỗi 10 phút** → xen kẽ `401` + `POST /auth/refresh` (3–4 SQL ghi xoay vòng `RefreshToken`) → giữ Neon thức gần như liên tục khi tab đang mở foreground! |
| **Auth Token Auto Refresh & Retry** | `apiClient` (`api-client.ts:176-192, 217-231`) | Tự động khi bất kỳ API nào trả `401` (`AUTH_TOKEN_EXPIRED` sau **600s**) | `POST /api/v1/system/auth/refresh` (`1` single-flight in-memory) + retry request gốc 1 lần (+ CSRF `GET /auth/csrf` nếu thiếu token) | Có `refreshInFlight` khử trùng đồng thời trong cùng tab; khác tab dựa vào `AUTH_REFRESH_REUSE_GRACE_SECONDS = 10s`. |
| **Donation Public Feed & Leaderboard Polling** | `DonationPublicFeed` (`donation-public-feed.tsx:151, 186`) | **Mỗi 20 giây** (Feed) & **mỗi 30 giây** (Leaderboard) khi đang mở trang Donate có `pageId` | `GET /api/v1/utilities/pages/{id}/donations/feed` & `/leaderboard` → **0 Redis cache, query trực tiếp PostgreSQL** | Mỗi phút gọi **5 requests DB** (`3` feed + `2` leaderboard) khi có 1 tab mở trang Donate → **chặn hoàn toàn Neon Scale-to-Zero**. |
| **FCM Push Token Sync on Mount** | `usePushRegistration` (`use-push-registration.ts:53-63`) | Mỗi lần component `NotificationBell` hoặc `PushDeviceCard` mount khi quyền trình duyệt là `"granted"` | Gọi Firebase Web SDK `getToken()` (`firebaseinstallations` + `fcmregistrations`) rồi `POST /api/v1/system/notifications/devices` (`2–3` SQL + `1–2` Redis RL) | Chỉ kiểm quyền khi mount/mở lại trang; nếu người dùng điều hướng hard reload nhiều lần sẽ ghi DB lặp lại. |
| **React Query Default Auto-Refetch & Retry** | `createQueryClient` (`query-client.ts:13-27`) | `staleTime: 30_000` (`30s`), `refetchOnWindowFocus: false` (toàn app, trừ `useUnreadCount` bật `true`), `refetchOnReconnect: true` (mặc định v5), `retry: 2` cho lỗi mạng/5xx (tắt cho 4xx) | Tránh retry 401/403/404/429 vô ích; nhưng `retry: 2` khi Neon timeout/5xx sẽ nhân `×3` request trong vài giây | Nhiều hook chọn `staleTime` dài hợp lý (`Infinity` cho IAM/journal-resources/qr-banks; `300s` cho public-settings/currencies). |
| **Open-Meteo Weather Fetch & Local Timers** | `useWeatherWidget` (`use-weather-widget.ts`), `useClock` (`use-clock.ts`) | Weather: chỉ gọi `api.open-meteo.com` khi mount Home hoặc đổi địa điểm nếu cache Zustand (`3 phút`) hết/F5; Clock `setInterval(1000ms)` & sunrise timer `60s` thuần client | **0** call tới Vercel BE/FE hay Neon | Cache weather dùng Zustand in-memory (`weather-store.ts:114`) nên mất khi F5/reload. |
| **Error Boundary Auto Report** | `useReportClientError` (`use-report-client-error.ts`) | Chỉ khi xảy ra React runtime crash (`error.tsx`, `global-error.tsx`) | `POST /api/v1/system/health/client-errors` → Redis RL + log console ERROR (0 DB nếu có Redis) | An toàn, rate limit `30/60s/ip`. |

### 3.3. Nhóm Event-Driven (Webhooks, Background Kick, Cache Invalidation, Logging)

- **Webhooks đến (`AllowAny`, xác thực riêng):**
  - `POST /api/v1/finance/sepay/webhook/{public_id}` (`sepay_webhook_view.py`): HMAC-SHA256 + Rate Limit `120/60s/ip` + tạo `Income` + `NotificationService.notify()`.
  - `POST /api/v1/utilities/donations/webhook/{webhook_token}` (`donation_webhook_view.py`): duyệt active donation pages (`list_active_donation_pages`), chống trùng `sepay_id`, ghi `DonationTransaction`.
  - `POST /api/v1/system/telegram/webhook` (`SystemTelegramWebhookView`): Redis dedup `system:tg:update:{update_id}` (`TTL 300s`), cập nhật `TelegramChat`, nếu cần AI LLM sẽ publish QStash 1-hop tới `/api/v1/workspace/assistant/telegram-process`.
- **Cache Invalidation (`CoreCrudService`):** Tạo/sửa/xóa `ShortLink`, `Page`, `PagePath`, `QrCode` kích `transaction.on_commit(bump_namespace("utilities:public"))` → `INCR` + `EXPIRE` (`30 ngày`), vô hiệu hóa tức thì toàn bộ cache public cũ (`utilities:public:{ver}:*`).
- **Logging (`settings.py:501-516`, `request_context_middleware.py:49-55`):** Mọi HTTP request ghi 1 dòng `INFO` (`method path status ms`) qua `StreamHandler` ra stdout Vercel Runtime Logs (0 ghi file, 0 DB).

---

## 4. Resource Consumption Per Operation

### 4.1. Phân tích chuyên sâu Health Check (`1 phút/lần`)

Luồng xử lý hoàn chỉnh của 1 request Health Check qua Django (`backend/config/settings.py:53-60, 194-208`):
1. **Middleware chain (`6 lớp`):** `SecurityMiddleware` → `CorsMiddleware` → `RequestContextMiddleware` (sinh `request_id`, bấm timer, ghi 1 dòng `logger.info` sau response) → `CommonMiddleware` → `CsrfViewMiddleware` (bỏ qua GET) → `XFrameOptionsMiddleware`. **Không middleware nào chạm DB hay Redis.**
2. **Authentication & Permissions:** Cả `HealthView` (`/api/v1/system/health`) và `ReadinessView` (`/api/v1/system/health/ready`) đều khai báo `authentication_classes = []`, `permission_classes = [AllowAny]` (`health_view.py:18-19`, `readiness_view.py:23-24`). **Không gọi `CookieJwtAuthentication` hay `IamPermissionBackend`.**
3. **Throttling (`BucketThrottle`):** Kiểm `_get_key()` cho method `GET` không có `@rate_limit` → trả về `None` → cho qua ngay lập tức (**0 Redis, 0 DB**).
4. **Endpoint Handler:**
   - **`GET /api/v1/system/health` (`HealthView`):** Chỉ đọc `settings.DEBUG` trong bộ nhớ, trả JSON `{"status": "ok", "debug": false}`.
     - DB queries: **0**. Redis commands: **0**. External API: **0**.
     - Chi phí khi chạy `1 phút/lần`: **`44.640` Vercel BE invocations/tháng**, **0 CU-hours Neon**, **0 lệnh Redis**. Tuy nhiên nếu serverless function tái khởi động nguội (cold start Django `~1–2s` CPU theo `infrastructure.md:67`), chi phí Active CPU ước đạt **`~1,2–1,9 giờ/tháng`** (`~30–47%` trần 4h CPU của Vercel Hobby `[ESTIMATED]`).
   - **`GET /api/v1/system/health/ready` (`ReadinessView`):** Gọi `HealthService.is_database_ready()` → `DatabaseRepository.ping()` → mở connection tới Neon (`-pooler`) và thực thi **`SELECT 1`** (`database_repository.py:9-16`).
     - DB queries: **1**. Redis: **0**.
     - Chi phí khi chạy `1 phút/lần`: Vì khoảng cách giữa 2 ping là `1 phút < 5 phút` auto-suspend, **Neon không bao giờ ngủ**. Với `0,25 CU`: `0,25 × 24 × 31 =` **`186,00 CU-hours/tháng` (`186%` quota — VƯỢT HẠN MỨC)**.
5. **Khuyến nghị phát hiện Server UP/DOWN nhẹ nhất:**
   - Scheduler định kỳ (mỗi **3–5 phút** thay vì 1 phút) chỉ gọi **`GET /api/v1/system/health`** để kiểm tra tiến trình Django/Vercel UP/DOWN với **0 SQL & 0 CU-hours**.
   - Nếu cần kiểm tra Neon DB kết nối được, chỉ gọi **`/api/v1/system/health/ready` theo sự kiện** (sau deploy CI/CD) hoặc tối đa vài giờ/lần nếu thực sự cần cảnh báo DB độc lập.

### 4.2. Phân tích Neon PostgreSQL & Khả năng Scale-to-Zero

- **Cấu hình kết nối (`backend/config/settings.py:76-94`, `deployment.md:68-69`):**
  - `DB_CONN_MAX_AGE = 0` (đóng kết nối sau mỗi request, tương thích Vercel Serverless + Neon `-pooler` PgBouncer).
  - `CONN_HEALTH_CHECKS = True`: trong Django 6, khi `CONN_MAX_AGE = 0`, kết nối luôn đóng cuối request nên không phát sinh `SELECT 1` thừa trước query đầu tiên của request kế tiếp (chỉ phát sinh nếu cấu hình `DB_CONN_MAX_AGE > 0`).
  - `DB_CONNECT_TIMEOUT = 10s` (đủ đợi Neon cold wake ~1–3s), `DB_STATEMENT_TIMEOUT_MS = 5000ms`.
- **Khả năng Scale-to-Zero & Tác nhân đánh thức Neon:**
  - Neon Free tự suspend sau **đúng 5 phút (`300 giây`)** không có query. Bất kỳ 1 query đơn lẻ nào cũng tạo ra ít nhất **5 phút compute** (`0,0208 CU-hours` ở `0,25 CU`) trừ khi trùng vào cửa sổ 5 phút của query trước đó.
  - **Nhóm tác nhân GIỮ Neon ngủ (0 SQL khi rảnh):** `HealthView`, `PagePublicView` (cache hit Redis), `ShortLinkService.get_public_link()` (chú ý: *đọc* cache hit không SQL, nhưng `ShortLinkResolveView.get` gọi tiếp **`record_access()`** — luôn ghi `UPDATE clicks_count` vào DB trừ khi cùng fingerprint click trong 3s `[VERIFIED]` tại `short_link_service.py:240-252`!), `NotificationDispatchView` (khi cờ Redis chưa tới hạn), `WorkspaceCronService._run_w1_monitors` (giữa các chu kỳ flush 6h).
  - **Nhóm tác nhân ĐÁNH THỨC / GIỮ Neon thức liên tục:**
    1. `ReadinessView` (`/health/ready`) hoặc `/cron/dispatch-due` (`force_w4=True`) nếu bị cron gọi `<= 5 phút` hoặc `15 phút`.
    2. `DonationPublicFeed` (`20s`/`30s` polling thẳng DB).
    3. `useUnreadCount` (`6 phút` khi tắt Push) + `auth/refresh` (`10 phút` access JWT) khi tab Admin/Portal mở.
    4. `NotificationKickService` (`IDLE_RECHECK_SECONDS = 6h` → `4 lần/ngày`) & `WorkspaceAlertsCacheService` (`+24h` window → `1 lần/ngày`).
    5. `ShortLinkResolveView` (`record_access()` ghi PostgreSQL trên **mỗi lượt khách mở link rút gọn** dù hit Redis cache!).
    6. `PublicSettingView` (`/system/settings/public`, không Redis cache → mỗi lượt khách mở trang Login/Home đánh thức Neon).
    7. Cleanup (`03:00 UTC`), Backup (`1 lần/ngày`), Migration khi deploy (`build_files.sh`).

### 4.3. Chi phí tài nguyên trên từng thao tác nghiệp vụ chính

| Thao tác | Vercel Invocations (FE + BE) | Neon DB Queries & Compute Impact | Redis Commands | External / R2 Ops |
| --- | --- | --- | --- | --- |
| **Mở 1 trang Public `/p/slug` (Cache HIT)** | 1 FE (`proxy` + page) + 1 BE (`page_public_view`) | **0 SQL** (0 CU-hours) | `2–4` (`INCR` RL + `GET ver` + `GET key`) | `0` R2 ops (ảnh qua Cloudflare `media.toannx.com` immutable); FE có thể gọi Umami/Vercel Analytics/Favicon/VietQR |
| **Mở 1 trang Public `/s/slug` (Cache HIT)** | 1 FE SSR (`force-dynamic`) + 1 BE | **1 SQL WRITE (`record_access` `UPDATE`)** — **CÓ đánh thức Neon 5 phút** (`short_link_service.py:252`) | `4–7` (RL + ver + key + debounce + visitor) | 1 Google Favicon V2 (client-side) |
| **Mở Trang Donate có Feed (xem 10 phút)** | 1 FE + 1 BE page + 30 Feed + 20 Leaderboard = **52 inv** | `>= 50` SQL reads → giữ Neon thức trọn **15 phút (`0,0625 CUh`)** | `~104` (RL mỗi 20s/30s `PUBLIC_READ`) | `img.vietqr.io` SVG |
| **Admin Login (Password)** | 1 FE + 1–2 BE (`csrf` + `login` + `me`) | ~`10–15` SQL (User, AuthSession, RefreshToken, Notification+Delivery outbox) + Argon2 ~`0.1s` CPU | `2–4` (RL + `NEXT_DUE` key) | `1` QStash publish (1-hop gửi alert login/new device) |
| **Request quản trị có xác thực (CRUD List)** | 1 BE | `1` SELECT `AuthSession+User` + `0..2` UPDATE touch (nếu `>1p`) + `1` SELECT `Permission` (nếu non-superuser) + `1–2` SQL resource | `0` (GET) hoặc `1–2` (POST/PATCH/DELETE `DEFAULT_WRITE`) + `2` (`bump_namespace` nếu utilities) | `0` |
| **Tải lên 1 file đính kèm (R2)** | 1 BE (`POST /attachments`) | `2–3` SQL (Quota + Folder + Attachment + Journal) | `1–2` (RL `DEFAULT_WRITE`) | `2` Cloudflare REST API (`R2UsageService` public+private) + `1` R2 `PutObject` (Class A) |
| **Mở 1 file riêng tư (`/attachments/{id}/content`)** | 1 BE (302 presigned URL) | `1–2` SQL (Auth + Attachment ownership) | `1–2` (RL `ATTACHMENT_CONTENT`) | `1` R2 `GetObject` khi trình duyệt theo link ký (Class B) |
| **Chat AI Telegram (QStash 1-hop)** | 2 BE (Webhook + Async Process) | ~`5–8` SQL (TelegramChat, WorkspaceSetting, Conversation, User/Assistant Msg, tool queries) | `3–5` (TG dedup + RL×2 + AI cooldown gets) | `1–3` xKiro API (`<=5s`/lượt) + `1` Telegram `sendMessage` |

---

## 5. Idle Usage (Tháng 31 ngày — Không có người dùng)

Vì cấu hình ngoài repo (endpoint đích của Health Check `1 phút/lần`, chu kỳ `cron-job.org` cho `/tick` & `/dispatch-due`, cách backup DB) là `[UNKNOWN]`, mục này tách rõ **2 kịch bản Idle** để quản trị viên đối chiếu:

- **Kịch bản Idle A (Cấu hình đúng chuẩn code hiện tại — Baseline tối ưu):**
  - Health Check `1p/lần` gọi `/api/v1/system/health` (`0` SQL).
  - `/notifications/dispatch` `10p/lần` (`REDIS_URL` bật).
  - `/workspace/cron/tick` `15p/lần` (`workspace/module.py:159`, giả sử `0` hoặc `1` monitor stable flush `6h/lần`), `/dispatch-due` chỉ QStash tự gọi `1/ngày`.
  - `/health/cleanup` `1/ngày` (`03:00 UTC`), DB Backup `1/ngày`.
- **Kịch bản Idle B (Ước lượng rủi ro theo thông số hiện trạng / nhầm cấu hình):**
  - Dùng làm đối chứng nếu `/health/ready` được gọi `1p/lần` hoặc `/dispatch-due` bị đặt `15p/lần` theo `docs/guides/deployment.md:50`, hoặc giải thích mức `13,08 CUh / 12 ngày`.

| Nền tảng / Chỉ số | Idle A — Đúng chuẩn code (31 ngày) | Idle B — Nếu cấu hình lệch (`deployment.md` hoặc `/health/ready`) | Phân loại |
| --- | --- | --- | --- |
| **Vercel BE Invocations** | `44.640` (health) + `4.464` (notif) + `2.976` (tick 15p) + `31` (cleanup) + `31` (W4 24h) + `124` (6h recheck QStash/cron overlaps) ≈ **`52.142 req/tháng`** (~`1.682/ngày`) | Nếu tick 5p + dispatch-due 15p: `44.640 + 4.464 + 8.928 + 2.976 + 31` ≈ **`61.039 req/tháng`** | `[CALCULATED]` |
| **Vercel Active CPU** | ~`0,01–0,02s` warm + ~`1,5s` × ~`90 cold starts/ngày` ≈ `~135–160s/ngày` ≈ **`1,16–1,38 giờ/tháng`** (nếu `/health` giữ container ấm nhiều hơn, CPU sẽ thấp hơn ~`0,4–0,8h` `[ESTIMATED]`) | Cao hơn ~15–20% do W4 full query mỗi 15p | `[ESTIMATED]` |
| **Vercel FE Invocations** | ~`100–300 req/tháng` (chỉ crawler/bot vào `/`, `robots.txt`, `sitemap.xml`) | Như Idle A | `[ESTIMATED]` |
| **Neon Compute (`CU-hours`)** | Notif 6h recheck (`4×5p=20p/d`) + W1 6h flush (nếu ≥1 monitor, gộp hoặc `+15p/d`) + W4 24h (`5p/d`) + Cleanup (`~6p/d`) + Backup (`~6p/d`) = **`~42–52 phút/ngày`** × `0,25 CU ÷ 60` = **`5,4–6,7 CU-hours/tháng`** *(nếu `0` monitor active & trùng cửa sổ: ~`4,4 CU-hours`)* | • Theo đà 12 ngày (`13,08 CUh`): **`~33,8 CU-hours/tháng`**<br>• Nếu `dispatch-due` 15p: **`~62–72 CU-hours/tháng`**<br>• Nếu `/health/ready` 1p: **`186,0 CU-hours/tháng` (CHẾT QUOTA)** | `[CALCULATED]` |
| **Neon Transfer / Storage** | Storage tăng `~0 MB/tháng` (cleanup dọn dữ liệu cũ). Egress backup: `31 × (17–100 MB [ESTIMATED])` ≈ **`0,52–3,10 GB/tháng`** *(theo đà `0,2 GB / 12d` = **`0,52 GB/tháng`**)* | Như Idle A + query response overhead (~`0,6–3,2 GB`) | `[CALCULATED]` / `[ESTIMATED]` |
| **Upstash Redis Commands** | • Notif cron `144/d × 2–3` ≈ `360/d`<br>• Tick `96/d × (4 + N_mon)` ≈ `~576/d` (với `2` monitors)<br>• Cleanup/QStash ≈ `10/d`<br>Tổng: **`~950 cmds/ngày` ≈ `~29.450 cmds/tháng`** | Nếu tick `5p` (`288/d`) + dispatch-due `15p` (`96/d`): **`~2.100 cmds/ngày` ≈ `~65.100 cmds/tháng`** | `[CALCULATED]` |
| **Upstash QStash Messages** | `1/ngày` (W4 24h) = **`31 tin/tháng`** (`0,1%` quota ngày) | Như Idle A | `[CALCULATED]` |
| **Cloudflare R2 Ops** | Cleanup 1/ngày: `2` `ListObjectsV2` (Class A) + `0..K` `HeadObject` (Class B, `K` = file chưa purge trong db reference) ≈ **`62 Class A/tháng`** | Như Idle A | `[VERIFIED]` |

---

## 6. Normal Usage (Tháng 31 ngày — 1 quản trị viên dùng hằng ngày)

### Giả định kịch bản Normal (`[ESTIMATED]`):
- **Quản trị viên (1 người):** Làm việc trên Admin/Portal **2,5 giờ/ngày** (khoảng **250 API requests/ngày**), cộng thêm mở tab trình duyệt nền/foreground tổng **4 giờ/ngày** (nhiều khi bật quên không tắt ngay, Web Push đã bật → `useUnreadCount` poll mỗi `15 phút`, đôi khi dùng tab chưa bật push → `6 phút`).
- **Thông báo & AI & Tài chính:** ~**15 thông báo/ngày** (login, nhắc việc, digest sáng, vài giao dịch SePay/thủ công); **1–2 email/ngày**; **5 tin nhắn AI Web/Telegram/ngày**; **10 lần upload file R2/ngày** (trong ngày làm việc, trung bình ~**3–5 upload/ngày**).
- **Khách & Công cụ công khai:** ~**80 lượt xem/ngày** (link rút gọn `/s/[slug]` + trang tùy chỉnh `/p/[slug]` + Home), trung bình **2 lượt/ngày** mở trang Donate (mỗi lượt mở `~3 phút` → `~15` lần poll Feed/Leaderboard mỗi lượt).
- **Dev/Deploy:** **4 lần push/PR CI + 4 lần deploy Vercel/tháng**.

### Mức tiêu thụ Normal (31 ngày) `[CALCULATED]` + `[ESTIMATED]`:
- **Vercel BE Invocations:** Idle (`52.142`) + Admin CRUD/Auth (`250 × 31 = 7.750`) + Auth Refresh/Bell idle (`~24/d × 31 = 744`) + Public (`80 × 31 = 2.480`) + Donate poll (`30 × 31 = 930`) + Notifications QStash (`15 × 31 = 465`) + AI/SePay (`10 × 31 = 310`) ≈ **`~64.800 req/tháng`** (`~2.090 req/ngày`, **`6,5%`** quota 1M).
- **Vercel FE Invocations:** Public SSR `/s/[slug]` + dynamic routes (`~1.800`) + Image Opt & edge proxy (`~3.000` `[ESTIMATED]`) ≈ **`~4.800 inv/tháng`** (Tổng BE+FE: **`~69.600 inv/tháng` = `7,0%`**; Image Optimization riêng ~`150–400` ảnh gốc = `15–40%` của 1.000 ảnh).
- **Vercel Active CPU:** Idle (`~1,2h`) + Admin & Auth Argon2 (`~0,15h`) + Public/AI/Upload (`~0,35h`) ≈ **`~1,7–2,1 giờ/tháng`** (**`42–53%`** trần **4 giờ**).
- **Neon PostgreSQL:**
  - Nếu tính trên nền Idle A sạch (`~0,2 CUh/d`) + quản trị viên hoạt động + idle tab (~**3,5–4,5 giờ thức/ngày** bao gồm sleep tail giữa các khoảng nghỉ nhỏ) + `50` shortlink clicks `record_access` rải rác (~`15–20` cụm wake × 5p = `~1,5h/d`) + backup + cleanup:
    - Tổng thời gian thức thực tế ≈ **`5,5–6,5 giờ/ngày`** (đã trừ phần trùng cửa sổ 5p) × `0,25 CU` × `31 ngày` = **`~42,6–50,4 CU-hours/tháng`** (**`42,6%–50,4%`** quota 100 CUh).
    - *Nhận xét đối chiếu thực tế:* Con số hiện tại của quản trị viên (`13,08 CUh / 12 ngày ≈ 33,8 CUh / 31 ngày`) nằm **rất sát** giữa Idle A (`~6 CUh`) và Normal này (`~43 CUh`)!
  - Storage: **`~210–250 MB`** (`~21–25%` của 1 GB). Egress: `0,52–1,5 GB/tháng` (`10–30%` của 5 GB).
- **Upstash Redis:** Idle (`29.450`) + Cache public/ShortLink/Metadata/Rate limit/AI cooldown (~`1.000/d × 31 = 31.000`) ≈ **`~60.450 cmds/tháng`** (**`12,1%`** của 500k).
- **Upstash QStash:** `(1 W4 + 15 notify + 3 AI + retries) × 31` ≈ **`~20–25 tin/ngày`** = **`~620–775 tin/tháng`** (**`2,5%`** quota ngày 1.000).
- **Cloudflare R2:** `150 uploads/tháng` (`300` R2Usage REST calls + `150` PutObject + `62` Cleanup List = **`~212 Class A/tháng`** `0,02%`; **`~500–2.000 Class B/tháng`** `< 0,02%`; Storage tăng theo dung lượng ảnh).
- **Firebase / SMTP / Open-Meteo / Umami / GitHub CI:** Tất cả đều **`< 5%`** giới hạn gói miễn phí.

---

## 7. Maximum Personal Usage (Tháng 31 ngày — Cường độ cá nhân cao)

### Giả định kịch bản Maximum Personal Usage (`[ESTIMATED]`):
- **Quản trị viên làm việc cường độ cao:** Dùng liên tục **8 giờ/ngày**, mở nhiều tab Admin/Portal/Truyện + trang Donate; **`1.200 API requests/ngày`** (nhập liệu lớn, sửa trang Tiptap, đọc truyện liên tục, re-fetch tỷ giá, import SePay, gửi test Telegram/AI); Push trình duyệt **TẮT** (nên `useUnreadCount` poll `6 phút/lần`).
- **Tài chính, Upload & Thông báo:** **`60 thông báo/ngày`**; **`10 email/ngày`**; **`30 lượt chat AI/ngày`** (kèm tool calls); **`30 upload R2/ngày`** (~50–100 MB ảnh/tài liệu); **`20 lần deploy/build Vercel`** (chạy migration & kiểm tra).
- **Khách công khai + Bot quét:** **`500 lượt truy cập/ngày`** (`/s/[slug]`, `/p/[slug]`, Home, đọc truyện) + trang Donate được mở **`2 giờ/ngày`** (poll 20s/30s = `300 req/ngày` vào DB!).

### Mức tiêu thụ Maximum Personal Usage (31 ngày) `[CALCULATED]` + `[ESTIMATED]`:
- **Vercel BE Invocations:** Idle (`52.142`) + Admin (`37.200`) + Donate poll (`9.300`) + Public (`15.500`) + QStash/Webhook/AI (`4.650`) ≈ **`~118.800 req/tháng`** (**`11,9%`** quota 1M).
- **Vercel FE Invocations:** `~25.000 inv/tháng` (Tổng BE+FE ~`14,4%` inv). **Rủi ro lớn:** Nếu tải > 1.000 ảnh truyện/thư viện khác nhau qua `<Image>` không gắn `unoptimized`, Image Optimization Vercel Hobby (**`1.000` source images/tháng**) **CÓ THỂ CHẠM TRẦN 100%**.
- **Vercel Active CPU:** Cường độ cao + nhiều AI requests (chờ I/O nhiều nhưng xử lý Python + Pillow QR + Excel/CSV export + Argon2 + ~120 cold starts/ngày) ≈ **`~3,1–3,8 giờ/tháng`** (**`78–95%`** — **CHẠM/VƯỢT NGƯỠNG AN TOÀN 80%** của 4 giờ Active CPU!).
- **Neon PostgreSQL:**
  - Admin làm việc 8h/ngày (tab poll 6p + refresh 10p → không ngủ trong 8h) + 500 lượt shortlink rải rác trong 16h còn lại (`record_access` luôn ghi PostgreSQL → cứ 2–10 phút có 1 khách bấm link rút gọn → Neon gần như **thức ~14–16 giờ/ngày**!) + Donate 2h/ngày + backup + 20 lần migrate:
    $$\text{Neon CU-hours} \approx 15\text{ giờ/ngày} \times 0,25\text{ CU} \times 31 = \mathbf{116,25\text{ CU-hours/tháng}}\ (\mathbf{116,3\%}\text{ — VƯỢT QUOTA } 100\text{ CUh!})$$
  - Kể cả khi khách chỉ tập trung vào ban ngày (~`10–11 giờ thức/ngày`), mức dùng vẫn lên tới **`77,5–85,3 CU-hours/tháng` (`78–85%` — VƯỢT NGƯỠNG AN TOÀN 80%)**!
  - Storage: `~260–350 MB` (`26–35%` của 1 GB). Egress: `1,5–4,2 GB/tháng` (`30–84%` của 5 GB — tùy dung lượng `pg_dump`).
- **Upstash Redis:** Idle (`29.450`) + `500` khách/ngày × `~6` lệnh (`3.000/d`) + `1.200` admin write/RL/cache bumps (`1.500/d`) + AI cooldown (`100/d`) = `~5.550/d` ≈ **`~172.000 cmds/tháng`** (**`34,4%`** của 500k).
- **Upstash QStash:** `(1 + 60×1.2 + 30) ≈ 103 tin/ngày` (`10,3%` quota ngày 1.000) ≈ **`~3.193 tin/tháng`**.
- **Cloudflare R2:** `930 uploads/tháng` → `~1.000 Class A` (`0,1%`); `~15.000 Class B` (`0,15%`); Storage tích lũy thêm `~1–2 GB/tháng` (cần chú ý `9 GB` safety cap).

---

## 8. Free Tier Budget (Tổng hợp định lượng 31 ngày)

Công thức chung: `Calls/month = Calls/day × 31` | `Usage % = (Estimated Monthly Consumption / Free Tier Quota) × 100%` | Ngưỡng cảnh báo an toàn: **80% quota**.

| Nền tảng & Tài nguyên | Hạn mức Free | Ngưỡng 80% | Idle A (Chuẩn) | Idle B (Hiện trạng / Rủi ro) | Normal Usage | Max Personal | Max calls / 1 thao tác nặng nhất | Nguy cơ vượt / Phát sinh phí |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Neon — Compute** | **100 CUh/tháng** | **80 CUh** | `5,4–6,7 CUh` (**6%**) | `33,8` *(theo 12d)* / `62–186 CUh` (**34–186%**) | `42,6–50,4 CUh` (**43–50%**) | **`78–116 CUh` (78–116%)** | `1` SQL mỗi >5p = `+0,0208 CUh` (`5p @ 0.25 CU`) | **CAO** (sẽ dừng DB, **0đ tự trừ phí** ở gói Free — nhưng sập toàn bộ site) |
| **Neon — Storage** | **1 GB (1.024 MB)** | **819 MB** (`DATABASE_MAX_BYTES` 80% alert đã có) | `207 MB` (**20%**) | `207 MB` (**20%**) | `~230 MB` (**22%**) | `~320 MB` (**31%**) | Batch import Novel/SePay `~1–5 MB`/lần | Thấp (đã có retention cleanup & cảnh báo 80%) |
| **Neon — Network Egress** | **5 GB/tháng** | **4,0 GB** | `0,52–3,1 GB` (**10–62%**) | `[UNKNOWN]` phụ thuộc cách backup | `0,6–1,5 GB` (**12–30%**) | `1,5–4,2 GB` (**30–84%**) | Full `pg_dump` qua mạng ngoài (`[UNKNOWN]`) | **TRUNG BÌNH–CAO** (nếu backup full hằng ngày không nén khi DB lớn dần) |
| **Vercel — Invocations (FE+BE)** | **1.000.000/tháng** | **800.000** | `~52.400` (**5,2%**) | `~61.300` (**6,1%**) | `~69.600` (**7,0%**) | `~143.800` (**14,4%**) | 1 phiên duyệt 15p Donate + Admin = `~60 inv` | **RẤT THẤP** (dư > 85%) |
| **Vercel — Active CPU (FE+BE)** | **4 giờ (14.400s)** | **3,2 giờ (11.520s)** | `~1,16–1,38h` (**29–35%**) | `~1,6h` (**40%**) | `~1,7–2,1h` (**43–53%**) | **`~3,1–3,8h` (78–95%)** | Cold start Django (`~1–2s`) + Xkrio/Pillow/Export | **CAO** (khóa tính năng/tạm ngưng Hobby tới 30 ngày nếu vượt `[VERIFIED]`) |
| **Vercel — Image Optimization** | **1.000 source imgs** (`Hobby` `[ESTIMATED]`) | **800** | ~0 (**0%**) | ~0 (**0%**) | `~150–400` (**15–40%**) | **`~800–1.500` (80–150%)** | Load gallery nhiều ảnh R2 không `unoptimized` | **TRUNG BÌNH** (ảnh đã có CDN `media.toannx.com` với `immutable`) |
| **Upstash Redis** | **500.000 cmds/tháng** | **400.000** | `~29.450` (**5,9%**) | `~65.100` (**13,0%**) | `~60.450` (**12,1%**) | `~172.000` (**34,4%**) | `WorkspaceDashboard`: `3 + N_monitors` GET tuần tự | **THẤP** (trừ khi để `/tick` 1p + 10 monitors) |
| **Upstash QStash** | **1.000 tin/ngày** | **800 tin/ngày** | `1/d` (**0,1%**) | `1/d` (**0,1%**) | `20–25/d` (**2–2,5%**) | `~103/d` (**10,3%**) | Burst `W4` (chỉ kick `1` lần cuối lượt nhờ `kick=False` + `flush_kick()`) | **RẤT THẤP** |
| **Cloudflare R2 — Storage & Ops** | **10 GB**, 1M A, 10M B | **9 GB** (đã set hard cap code), 800k A | `62 A`, `~0 B` (**<0,01%**) | Như Idle A | `~212 A`, `~1k B` (**<0,02%**) | `~1k A`, `~15k B` (**0,15%**) | `purge_orphans`: `2 List + N Head` mỗi ngày | **THẤP** về Ops; nhưng R2 bắt đầu tính tiền nếu vượt 10 GB (`[VERIFIED]`: `infrastructure.md:47`) |
| **Open-Meteo / Umami / V.Analytics** | 10k/d · 100k/m · 50k/m | 80% từng loại | ~0 (**0%**) | ~0 | `~1–2%` | `~5–15%` | 1 lượt mở Home F5 liên tục không cache persistent | **RẤT THẤP** |
| **SMTP / FCM / Telegram** | ~500 thư/d · Unlim · ~30 msg/s | 400 thư/d | 0 | 0 | `< 1%` | `< 6%` | 1 lượt `notify` có retry 5 lần | **RẤT THẤP** |

*(Lưu ý về chi phí phát sinh: Vercel Hobby, Neon Free, Upstash Free, Firebase Spark, `cron-job.org` **không tự thu tiền** khi vượt quota mà sẽ **tạm khóa / ngừng dịch vụ / trả lỗi**; **chỉ Cloudflare R2** yêu cầu thẻ khi bật dịch vụ và bắt đầu tính tiền theo mức dùng nếu vượt `10 GB` / `1M` Class A / `10M` Class B — xem `docs/architecture/infrastructure.md:41-49`.)*

---

## 9. Recommended Configuration

Ưu tiên **đơn giản, event-driven, dùng ngay hạ tầng sẵn có (không thêm công nghệ mới)** để đưa hệ thống về mức `< 20%` quota mọi dịch vụ và giúp Neon Scale-to-Zero tối đa:

| Hạng mục | Cấu hình hiện tại (`[VERIFIED]`) | Cấu hình đề xuất tối ưu | Lợi ích ước tính |
| --- | --- | --- | --- |
| **1. Cron Interval** | • Health check: `1 phút/lần` (`[UNKNOWN]` path)<br>• Notify dispatch: `10 phút/lần` (`cron-job.org`)<br>• Workspace tick: `15–30p` (`module.py`) vs `5p` (`deployment.md`)<br>• Dispatch-due: `deployment.md` ghi `15p` (`force_w4=True`!)<br>• Cleanup: `0 3 * * *` (1/ngày) | • **Health check:** Trỏ chắc chắn vào **`GET /api/v1/system/health`**, giãn lên **`3–5 phút/lần`** (giảm từ `44.640` xuống `8.928–14.880 req/tháng`). Tuyệt đối **không** poll `/health/ready` theo phút.<br>• **Workspace Tick:** Chốt **`15–30 phút/lần`** (`30p` nếu monitor interval >= 30p), sửa `deployment.md` đồng bộ.<br>• **Workspace Dispatch-Due:** **XÓA** cron ngoài nếu đã có QStash (`QStash` tự gọi theo lịch hẹn 7 ngày); chỉ giữ dự phòng khi tắt QStash.<br>• **Notify Dispatch:** Giữ `10–15 phút/lần`, nâng `IDLE_RECHECK_SECONDS` từ `6h` → **`24h`** (`dispatch` khi cleanup `03:00` đã chạy `force=True` hằng ngày rồi!).<br>• **W4 NextDue Idle:** Chỉ tự publish QStash 24h nếu thực sự có user bật `daily_digest_enabled` hoặc có reminder/asset/sub trong cửa sổ 7 ngày. | Tiết kiệm ~**30.000** Vercel invocations/tháng & giảm ~**60–70%** thời gian CPU cold start `/health`; loại bỏ hoàn toàn **4 lần đánh thức Neon vô ích/ngày** từ `IDLE_RECHECK_SECONDS=6h`. |
| **2. Cache TTL & Điểm bổ sung cache** | • `utilities:public` TTL `600s` + missing `60s` (`public_cache.py`)<br>• `link_metadata` TTL `7 ngày`<br>• `telegram:bot_info` TTL `24h`<br>• **Thiếu cache:** `SettingService.get_public_settings()`, `DonationPublicFeed/Leaderboard`, `R2UsageService` | • Bổ sung `CacheService` (Redis `300–600s` + `invalidate_public_cache` khi sửa Setting) cho **`SettingService.get_public_settings()`**.<br>• Cache Redis **`15–30s`** (và tăng invalidation ngay trong `DonationTransactionService.ingest_webhook`) + `Cache-Control: public, max-age=15` cho **Donate Feed & Leaderboard**.<br>• Cache kết quả **`R2UsageService.get_bucket_usage_bytes()`** `5–10 phút` trong Redis để tránh gọi Cloudflare REST API v4 hai lần trên mỗi upload liên tiếp.<br>• Ở `ShortLinkResolveView`: gom/đẩy `record_access` bằng buffer Redis (`HINCRBY` + flush định kỳ trong `cleanup`/cron) **hoặc** chấp nhận chỉ ghi DB khi hết `visitor` 24h thay vì mỗi lượt click 3s nếu lưu lượng shortlink cao.<br>• FE Weather: lưu cache 3–10 phút vào `localStorage`/`sessionStorage` (Zustand `persist`) để F5 không gọi lại Open-Meteo. | Cắt gần **100% SQL trên khách công khai** (kể cả khi mở trang Donate, Login hay ShortLink), giúp Neon đạt **Scale-to-Zero > 90%** khi vắng admin. |
| **3. Polling Interval (Frontend)** | • `useUnreadCount`: `6 phút` (tắt push) / `15 phút` (bật push) + `refetchOnWindowFocus: true`<br>• `DonationPublicFeed`: **`20s`** (feed) & **`30s`** (leaderboard) | • **`DonationPublicFeed`**: Tăng lên tối thiểu **`60–120s`** khi tab đang active, **bắt buộc `refetchIntervalInBackground: false`**, hoặc chỉ refresh khi user bấm / sau `300s` (kết hợp Redis cache `15–30s` ở BE để không chạm DB).<br>• **`useUnreadCount`**: Giữ `15 phút` khi có Push; nâng `POLL_WITHOUT_PUSH_MS` từ `6 phút` → **`10–15 phút`** (bỏ thói quen thức DB sát nút `5p` của Neon), giữ `refetchIntervalInBackground: false`, đặt `staleTime: 60s` để `refetchOnWindowFocus` không bắn lại liên tục mỗi lần chuyển tab.<br>• **`usePushRegistration`**: Chỉ gọi `pushDeviceService.register()` khi token FCM khác token đã lưu ở `localStorage` hoặc quá 24h mới gia hạn `last_seen_at`, thay vì `POST` mỗi lần mở Admin/Portal. | Cắt **~80–90%** đánh thức Neon khi Admin/Khách treo tab trình duyệt mà không thao tác. |
| **4. Retry Limit & Backoff** | • FE QueryClient: `retry: 2` cho lỗi mạng/5xx; `0` cho 4xx (`query-client.ts`)<br>• QStash: `Upstash-Retries: 2` (`qstash_client.py`)<br>• Outbox Notification: `5` lần (`1/5/15/60/240p`)<br>• AI xKiro: max `3` models, no same-model retry | • FE `query-client.ts`: Hạ `MAX_RETRIES` từ `2` xuống **`1`** với timeout/503/500 (tránh nhân `×3` request khi Neon đang cold wake >10s hoặc vượt timeout) và thêm `retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000)`.<br>• Giữ QStash retries `= 2` và Outbox backoff `1/5/15/60/240p`. | Giảm bão retry lên tới **50%** khi Neon cold start hoặc mạng chập chờn. |
| **5. Timeout** | • FE `apiTimeoutMs=15s`, `uploadTimeoutMs=60s`<br>• BE `DB_CONNECT_TIMEOUT=10s`, `DB_STATEMENT_TIMEOUT_MS=5000ms`<br>• Redis `1s`, QStash `1s`, R2Usage `3s`, FCM/Notif `3s`, SMTP/TG/xKiro/SafeHttp `5s`, OAuth/VCB/SePay `10s` | Giữ toàn bộ timeout hiện tại (đều rất chặt và chuẩn Serverless), **bổ sung `AbortSignal.timeout(5000)`** cho `fetch` Open-Meteo phía FE (`use-weather-widget.ts:127`) để tránh treo UI. | Chặn function/request treo vô hạn ăn CPU & thời gian Vercel. |
| **6. Rate Limit** | • `PUBLIC_READ`: `120/60s/ip`<br>• `DEFAULT_WRITE`: `300/60s/user`<br>• Cron endpoints: `60/60s/ip` (`CRON_TICK`, `CRON_DISPATCH_DUE`)<br>• `BucketThrottle` áp `DEFAULT_WRITE` cho mọi `POST` chưa khai `@rate_limit` | • Giữ nguyên ngưỡng bảo vệ.<br>• Với endpoint **nội bộ chỉ xác thực bí mật (`CRON_SECRET` / `Upstash-Signature`)** như `NotificationDispatchView`, `WorkspaceCronTickView`, `WorkspaceCronDispatchDueView`: xem xét bỏ qua `BucketThrottle` (chỉ check `hmac.compare_digest` / JWT signature trước rồi mới xử lý) để **không tốn 1–2 lệnh Redis (hoặc 1 INSERT DB khi Redis lỗi)** cho mỗi nhịp cron hợp lệ. | Tiết kiệm `~7.500–15.000` lệnh Redis/tháng và chặn nguy cơ cron đánh thức/ghi DB `RateLimitBucket` nếu Redis tạm nghẽn. |
| **7. Data Retention** | • `JOURNAL_RETENTION_DAYS = 365`<br>• `AUTH_EXPIRED_RETENTION_DAYS = 30`<br>• `ATTACHMENT_PURGE_DAYS = 30`<br>• Notification Read `90d` / All `180d` / Delivery `30d`<br>• PushDevice stale `60d`<br>• MonitorIncident `90d` / Assistant History `180d` | Hợp lý cho gói Neon 1 GB. Nếu `JournalEntry` hoặc `AssistantMessage` phình nhanh (> 500 MB), hạ `JOURNAL_RETENTION_DAYS` về **`180`** và `ASSISTANT_HISTORY_RETENTION_DAYS` về **`90`** qua ENV. | Duy trì DB lâu dài quanh mức `200–350 MB` (`< 35%` của 1 GB). |
| **8. Batch Processing** | • Notification bulk: `500`, Cron dispatch batch: `200` / `50s`<br>• `purge_deleted` batch: `500`, `WorkspaceMonitor`: `10` threads / `20s` budget<br>• **Chưa batch:** `overlay_redis_state()` trong `WorkspaceDashboard` & `_build_digest_payload` gọi `GET` trong vòng lặp `for` (`N` lệnh RTT nối tiếp); `purge_orphans` quét toàn bộ R2 mỗi ngày | • Bổ sung `CacheService.get_many_json(keys)` (`MGET`) cho `overlay_redis_state` để giảm `N` vòng RTT Redis xuống **`1` lệnh `MGET`**.<br>• Với `AttachmentPurgeService.purge_orphans`: chỉ chạy **`1 lần/tuần`** (vd Chủ Nhật tại cleanup cron) hoặc kiểm tra theo prefix `attachments/YYYY/MM/` gần nhất, thay vì quét toàn bộ cây thư mục R2 mỗi ngày. | Giảm mạnh latency & Redis ops trên Dashboard/Digest và giữ R2 Class A/B ops gần như bằng 0 khi kho file lớn lên nghìn tệp. |
| **9. API Request Deduplication** | • FE: `apiClient` có `refreshInFlight` & `csrf.ts` có `pending` single-flight; TanStack Query tự dedup theo `queryKey`<br>• BE: `Notification` có `dedup_key`; Telegram có `system:tg:update:{id}`; QStash có `Upstash-Deduplication-Id` | • Bật FE `<Image unoptimized />` (hoặc cấu hình dùng thẳng CDN `media.toannx.com`) cho ảnh public R2 ở `novel-card.tsx`, `novel-detail.tsx`, `author-table.tsx`... để tránh gọi trùng qua `/_next/image`.<br>• Chuẩn hóa `queryKey` ổn định, tránh tạo key động thay đổi timestamp khiến QueryClient gọi lại. | Bảo vệ giới hạn 1.000 source images/tháng trên Vercel Hobby và tránh request thừa. |
| **10. Quota Protection & Circuit Breaker** | • **Đã có:** `DatabaseUsageService` (cảnh báo 80% Neon 1 GB), `AttachmentService` (cảnh báo 90% & hard block ở 9 GB R2), `CacheService._down_until` (`30s` circuit breaker khi Redis lỗi), `XkiroClient` (`120s` cooldown khi model AI lỗi/429), `CoreCrudService.owner_quota_setting`<br>• **Chưa có:** Tự ngắt/hạ cấp khi Neon gần hết `100 CU-hours` hoặc Redis gần `500k` cmds | • **Redis Budget Guard:** Trên tầng `CacheService` / Admin, không cho phép thêm polling < 5 phút hoặc cache admin session.<br>• **Access Token JWT Lifetime:** Tăng `AUTH_ACCESS_TOKEN_LIFETIME_SECONDS` từ `600s` (**10 phút**) lên **`1800s` (30 phút)** hoặc **`3600s` (60 phút)** (vì mỗi request auth ĐÃ kiểm trực tiếp trạng thái thu hồi `sid` trên PostgreSQL tại `auth_session_service.py:75` — revoke vẫn có hiệu lực ngay lập tức!) → giảm `3–6×` số lần xoay vòng `RefreshToken` (write DB).<br>• **Circuit Breaker chuẩn hóa:** Bổ sung circuit breaker nhẹ cho `R2UsageService` (tạm nghỉ `60s` trên cache/in-memory nếu Cloudflare API lỗi) và `VietcombankRateClient` (ghi nhớ tạm miss trong ngày để tránh spam 7-day lookback `7` HTTP calls khi VCB bảo trì). | Giảm viết DB từ token rotation, loại bỏ `7×` HTTP calls lặp lại khi VCB lỗi, và bảo toàn tính ổn định hệ thống. |

*(Ghi chú thêm về Backup DB: Tối ưu lịch backup `pg_dump` bằng cách nén tối đa `--format=custom --compress=9` và chạy ngay sau `03:00 UTC` — cùng cửa sổ thức của `cleanup` cron — để dùng chung 1 lần wake Neon thay vì 2 cửa sổ sleep tail 5 phút tách biệt, đồng thời giảm băng thông egress xuống < 1 GB/tháng!)*

---

## 10. Risks (Xếp hạng theo mức độ nghiêm trọng)

| Mức độ | Rủi ro | Cơ chế gây lỗi & Hậu quả thực tế | Bằng chứng `[VERIFIED]` / `[CALCULATED]` |
| --- | --- | --- | --- |
| **P0 — Nghiêm trọng** | **Health check `1 phút/lần` gọi nhầm `/health/ready` hoặc cron gọi `/dispatch-due` mỗi `15p`** | Giữ Neon không thể Scale-to-Zero → tiêu thụ **`62–186 CU-hours/tháng`** → **sập toàn bộ DB giữa tháng** (`Neon hết CUh = toàn site lỗi DB`). | `readiness_view.py:45`, `workspace_cron_dispatch_due_view.py:35`, `deployment.md:50`, `infrastructure.md:44, 129` |
| **P0 — Nghiêm trọng** | **Trang Donate công khai polling `20s`/`30s` thẳng PostgreSQL (`DonationPublicFeed`)** | Chỉ cần 1 tab khách/chủ site mở trang Donate liên tục sẽ bắn `5 SQL/phút`, chặn 100% Scale-to-Zero Neon và đốt `PUBLIC_READ` rate limit (`120/60s/ip` — gần nửa ngưỡng!). | `donation-public-feed.tsx:151, 186`, `donation_public_feed_view.py`, `donation_public_leaderboard_view.py` |
| **P1 — Cao** | **Vercel Active CPU trần `4 giờ/tháng` trên gói Hobby (FE+BE dùng chung)** | Health check `1 phút/lần` (`44.640 req/tháng`) + Django cold start (`1–2s` CPU) + usage cường độ cao dễ đẩy tổng CPU vượt **`3,2–4,0 giờ/tháng`**, dẫn tới bị Vercel khóa tạm thời tới 30 ngày. | `infrastructure.md:43, 67` |
| **P1 — Cao** | **Neon Network Transfer `5 GB/tháng` bị đốt bởi `pg_dump` hằng ngày** | Khi DB tăng từ `206 MB` lên `400–600 MB`, `pg_dump` hằng ngày qua mạng ngoài không nén có thể chạm `5 GB/tháng`. | User input (`0,2 GB / 12d`), `infrastructure.md:44` |
| **P1 — Cao** | **`ShortLinkResolveView` luôn ghi SQL (`record_access`) dù hit Redis cache** | Tác vụ public tưởng chừng 0-DB vẫn đánh thức Neon mỗi khi có 1 lượt mở link rút gọn mới (`>3s`), phá vỡ giả định mục 3.2 `infrastructure.md` ("lượt khách có cache = 5–15 CUh"). | `short_link_resolve_view.py:51-54`, `short_link_service.py:240-252` |
| **P2 — Trung bình** | **`NotificationKickService` (`6h` recheck) + `useUnreadCount` (`6p` nếu tắt Push) + JWT `10p`** | Gây các nhịp wake nền cố định và buộc xoay vòng `RefreshToken` liên tục khi admin mở tab làm việc mà không thao tác. | `notification_kick_service.py:23`, `use-unread-count.ts:13-14`, `settings.py:265` |
| **P2 — Trung bình** | **R2 trả phí vượt `10 GB` hoặc `purge_orphans` quét `ListObjectsV2` toàn bộ 2 bucket mỗi ngày** | Không tự khóa ở `10 GB` mà **bắt đầu tính phí thẻ** (`infrastructure.md:47`); quét toàn bộ folder `attachments/YYYY/MM/` tăng dần theo thời gian dễ tiệm cận timeout serverless hoặc tốn ops. | `attachment_purge_service.py:66-95`, `infrastructure.md:47` |
| **P2 — Trung bình** | **Vercel Image Optimization (`1.000` source images) trên ảnh công khai không gắn `unoptimized`** | Các màn hình Novel/Avatar/Table dùng `<Image>` cho URL `media.toannx.com` không tắt optimization → có thể chạm giới hạn `1.000` ảnh gốc của Hobby khi thư viện truyện/ảnh lớn. | `novel-card.tsx:50`, `attachment-preview.tsx:44` |
| **P3 — Thấp** | **Lỗi ẩn từ `PublicSettingView` (chưa cache), `N` vòng RTT Redis trong `overlay_redis_state`, Dead code `server-api.ts`** | Làm tăng độ trễ và lượng SQL/Redis không cần thiết nhưng chưa gây vượt quota ở lưu lượng cá nhân nhỏ. | `setting_service.py:83-96`, `workspace_dashboard_service.py:88-90`, `server-api.ts` |

---

## 11. External Information Required (Dữ liệu `[UNKNOWN]` cần quản trị viên bổ sung)

Vì chỉ phân tích source code, các thông số vận hành thực tế sau **nằm ngoài repository** (`[UNKNOWN]`) và cần quản trị viên xác nhận để hoàn tất đối chiếu 100%:

1. **Cấu hình Health Check (`1 phút/lần`):**
   - Dịch vụ nào đang ping (UptimeRobot, `cron-job.org`, BetterStack, Cloudflare Health Checks, hay monitor khác)?
   - **URL chính xác đang gọi** là `/api/v1/system/health` hay `/api/v1/system/health/ready` (hay URL Frontend `toannx.com`)?
2. **Danh sách toàn bộ job trên `cron-job.org` (hoặc scheduler khác):**
   - Job `/api/v1/system/notifications/dispatch`: đang chạy mỗi mấy phút?
   - Job `/api/v1/workspace/cron/tick`: có đang bật không, chạy mỗi `5 phút`, `15 phút` hay `30 phút`?
   - Job `/api/v1/workspace/cron/dispatch-due`: có bị tạo job định kỳ thủ công theo `docs/guides/deployment.md:50` hay không?
3. **Cơ chế Backup Database (`1 ngày/lần`):**
   - Backup chạy bằng công cụ gì (`pg_dump` trên GitHub Actions / máy cá nhân / VPS ngoài, hay tính năng tự động của Neon) và vào khung giờ UTC nào?
   - File dump có nén không, dung lượng truyền tải thực tế mỗi lần là bao nhiêu MB (để giải thích con số `0,2 GB / 12 ngày`)?
4. **Cấu hình Console thực tế trên Neon, Upstash, Vercel, Cloudflare:**
   - **Neon:** Compute size đang cố định ở `0,25 CU` hay bật Autoscaling (`0.25–2 CU`)? Có nhánh Preview/Branch nào khác đang tiêu CU không? Lịch sử Active Hours vs Suspend trên Neon Monitoring.
   - **Upstash Redis & QStash:** Có đang bật `REDIS_URL` và `QSTASH_TOKEN` trên Vercel production không, hay đang chạy ở chế độ fallback PostgreSQL? Số lệnh Redis & QStash thực tế 12 ngày qua trên dashboard Upstash?
   - **Vercel Usage 12 ngày qua:** Tổng Function Invocations, **Active CPU hours**, Fast Data Transfer, và Image Optimization count cho 2 project `toannx-frontend` và `toannx-backend`.
   - **Cloudflare:** Đã cấu hình `CLOUDFLARE_API_TOKEN` chưa? Bucket public/private đang dùng bao nhiêu MB/GB và bao nhiêu Class A/Class B ops? Có bật Cloudflare Web Analytics tự động chèn script `cloudflareinsights.com` không?
   - **xKiro AI & SMTP:** Hạn mức miễn phí (RPM/TPM/quota tháng) của provider `XKIRO_API_BASE` và nhà cung cấp SMTP đang dùng.

---

## 12. Source Code Evidence (Đối chiếu chính xác `file:line`)

| Chủ đề | File & Dòng trích dẫn (`[VERIFIED]`) | Nội dung chứng minh |
| --- | --- | --- |
| **Deployment & Vercel Cron** | `backend/vercel.json:15-19`, `backend/pyproject.toml:94-97`, `backend/build_files.sh:7` | Chỉ có 1 Vercel Cron (`GET /api/v1/system/health/cleanup` lúc `0 3 * * *`); build chạy `python manage.py migrate --noinput`. `frontend/vercel.json` không tồn tại. |
| **Django Middleware, DB, Rate Limit & JWT** | `backend/config/settings.py:53-60, 76-94, 194-208, 265-276, 317-384, 501-516` | Middleware không chạm DB; `DB_CONN_MAX_AGE=0`, `CONN_HEALTH_CHECKS=True`, `DB_CONNECT_TIMEOUT=10`, `DB_STATEMENT_TIMEOUT_MS=5000`; `AUTH_ACCESS_TOKEN_LIFETIME_SECONDS=600`; Rate limit table dùng `BucketThrottle` + Redis/Postgres. |
| **Health Check Endpoints** | `backend/app/system/views/health_view.py:15-31`, `readiness_view.py:20-47`, `health_service.py:23-34`, `database_repository.py:9-23` | `HealthView` trả `{"status":"ok"}` với 0 DB/0 Redis; `ReadinessView` chạy `SELECT 1` trên DB; `BucketThrottle._get_key()` trả `None` cho `GET` không `@rate_limit`. |
| **Cleanup Cron** | `backend/app/system/views/cleanup_view.py:21-50`, `cleanup_service.py:15-29`, `system/module.py:219-226`, `workspace/module.py:187-190`, `attachment_purge_service.py:42-102` | Xác thực `CRON_SECRET`; chạy 8 task từ `system` + `workspace`; `purge_orphans` quét toàn bộ thư mục `attachments/` trên cả `public` và `private` R2 storage. |
| **Auth Session & Touch Interval** | `backend/app/system/authentications/cookie_jwt_authentication.py:15-52`, `auth_session_service.py:22, 62-92`, `auth_session_repository.py:59, 134-140`, `refresh_token_service.py:75-138` | Mỗi request xác thực chạy `find_active` (`AuthSession` + `User` + `Avatar`) và ghi `touch` + `record_activity` nếu `last_used_at` cũ hơn `1 phút`. Refresh xoay vòng token trong DB transaction. |
| **Rate Limit & Cache Service** | `backend/app/core/cache/cache_service.py:21-182`, `backend/app/system/throttles/bucket_throttle.py:19-67`, `backend/app/system/services/rate_limit_service.py:37-99` | Socket timeout `1.0s`, outage mute `30.0s`; `incr_window` dùng `INCR` + `EXPIRE` lần đầu; fallback `RateLimitBucketRepository.increment` (PostgreSQL UPSERT). `BucketThrottle` áp `DEFAULT_WRITE` cho mọi `POST` chưa gắn `@rate_limit`. |
| **Notification Outbox, QStash & Redis Mark** | `backend/app/system/services/notification_service.py:83-171, 215-242`, `notification_kick_service.py:20-91`, `notification_dispatcher.py:43-220`, `qstash_client.py:22-124` | Outbox ghi DB → `on_commit` `kick()` tới QStash (`timeout=1s`, `retries=2`); endpoint dispatch kiểm `Upstash-Signature` hoặc `CRON_SECRET`; khi rỗng ghi Redis `NEXT_DUE_KEY` TTL `6 giờ` (`IDLE_RECHECK_SECONDS`). Retry lùi `1/5/15/60/240` phút. |
| **Workspace Cron W1 / W4** | `backend/app/workspace/views/workspace_cron_tick_view.py`, `workspace_cron_dispatch_due_view.py`, `workspace_cron_service.py:88-576`, `workspace_alerts_cache_service.py:36-224`, `workspace_defaults.py:1-61` | `/cron/tick` dùng Redis-only khi rảnh + flush DB mỗi `6h` (`MONITOR_BATCH_FLUSH_HOURS`); `/cron/dispatch-due` đặt `force_w4=True` (bỏ qua Redis check!). `compute_next_due_epoch` đặt trần `+24h` và tự publish QStash `ws-alerts-{bucket}`. `SafeHttpClient` timeout `<= 5s`. |
| **Utilities Public Cache & No-Cache Paths** | `backend/app/utilities/constants/public_cache.py:8-12`, `short_link_service.py:82-253`, `short_link_resolve_view.py:41-58`, `page_service.py:72-96`, `setting_service.py:83-96` | `utilities:public` TTL `600s` + missing `60s`; `ShortLinkResolveView.get` luôn gọi `record_access()` ghi DB nếu không trúng debounce 3s; `SettingService.get_public_settings()` & `DonationPublicFeed/Leaderboard` không cache Redis. |
| **R2 Storage & External Clients** | `backend/app/core/storage/r2_storage.py:8-52`, `r2_private_storage.py:10-26`, `r2_usage_service.py:29-105`, `attachment_service.py:96-122, 195-200`, `xkiro_client.py:20-188`, `vietcombank_rate_client.py:22-53`, `sepay_api_client.py:34-101`, `fcm_client.py:36-94`, `telegram_client.py:19-120` | R2 public `immutable`, private signed URL `300s`; mỗi upload kiểm tra usage via Cloudflare API v4 (2 buckets); `XkiroClient` `<=5s` fallback max 3 models + cooldown `120s`. |
| **Frontend Proxy, Queries & API Client** | `frontend/src/proxy.ts:32-85`, `shares/lib/query-client.ts:5-28`, `shares/lib/api/api-client.ts:49, 72-245`, `shares/lib/api/csrf.ts:36-57`, `app/s/[slug]/page.tsx:5` | `proxy.ts` routing + cookie check `session_hint`; QueryClient `staleTime=30s`, `refetchOnWindowFocus=false`, `retry=2` (0 cho 4xx); single-flight `refreshInFlight` & CSRF; `/s/[slug]` dùng `force-dynamic`. |
| **Frontend Polling, Push, Weather & Analytics** | `modules/system/hooks/use-unread-count.ts:13-29`, `modules/utilities/components/page/donation-public-feed.tsx:151, 186`, `modules/system/components/push-device/hooks/use-push-registration.ts:45-80`, `modules/home/components/landing/hooks/use-weather-widget.ts:127-218`, `shares/components/analytics/app-analytics.tsx:47-67`, `frontend/next.config.ts:19-80` | `useUnreadCount` poll `6p` / `15p`; `DonationPublicFeed` poll `20s` / `30s`; Weather Zustand cache `3p` (Open-Meteo); Umami + Vercel Analytics tải ở public routes; `cloudflareinsights.com` + `api.qrserver.com`/`duckduckgo` chỉ nằm trong `next.config.ts`. |
| **Dead Code & Tài liệu lệch nhau** | `frontend/src/shares/lib/api/server-api.ts:1-64`, `docs/guides/deployment.md:50`, `backend/app/workspace/module.py:159-175` | `server-api.ts` không còn caller; `deployment.md:50` ghi `cron/tick` 5p và `dispatch-due` 15p mâu thuẫn với thiết kế QStash/15–30p trong `workspace/module.py` và `infrastructure.md`. |
