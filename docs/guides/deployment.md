# Triển khai (Vercel + Neon)

Trạng thái: **READY** (cấu hình đã có, build production đã chạy thành công local).
**Chưa DEPLOYED** — chưa có credentials Vercel/Neon.

## Kiến trúc

| Project Vercel | Root directory | Domain |
| --- | --- | --- |
| `toannx-frontend` | `frontend/` | `toannx.com` |
| `toannx-backend` | `backend/` | `api.toannx.com` |

Trình duyệt gọi trực tiếp API `https://api.toannx.com` qua `NEXT_PUBLIC_API_URL` (CORS credentials include), Cloudflare
nhận diện đúng IP client thực tế qua `CF-Connecting-IP`. Trình duyệt gửi cookie phiên host-only tới `api.toannx.com`,
cookie `session_hint` được gắn domain `.toannx.com` để Next.js proxy kiểm tra lạc quan.
Có thể gọi trực tiếp `api.toannx.com` bằng `Authorization: Bearer` (không CSRF).

## 0. File biến môi trường

Mỗi phía (`backend/`, `frontend/`) có ba file; chỉ `.env.example` được commit (các file khác chứa bí mật, đã gitignore):

| File | Dùng cho | Điểm chính |
| --- | --- | --- |
| `.env.local` | Máy dev + pytest | DB PostgreSQL local; lưu file vào `backend/media` (không R2, không `CLOUDFLARE_API_TOKEN`); email in ra terminal; `SEPAY_ENV=sandbox`; frontend trỏ `http://localhost:8001`, chạy ở `3001` |
| `.env` | Production | `DJANGO_DEBUG=False`, host `toannx.com` / `www.toannx.com` / `api.toannx.com`, R2 2 bucket, SMTP thật, `SEPAY_ENV=production`, `CRON_SECRET`; **`DATABASE_URL` phải điền chuỗi Neon** |
| `.env.example` | Mẫu | Đủ mọi biến code đọc, chú thích tiếng Việt, không bí mật |

- Backend: có `.env.local` thì **chỉ đọc file đó** (không gộp `.env`), nên máy local không thể dùng nhầm DB/R2 production.
  Server production không có `.env.local`. Biến đặt sẵn trong môi trường (Vercel, CI) luôn thắng file.
- Frontend (Next.js): dev đọc `.env.local` rồi gộp `.env`; `frontend/.env.local` khai đủ mọi biến để không giá trị
  production nào lọt vào. Trên Vercel, chép nội dung `frontend/.env` vào Environment Variables.
- Test backend: `backend/conftest.py` tắt R2/Cloudflare Usage API/Firebase và dừng nếu `DATABASE_URL` không phải
  PostgreSQL local — không tốn lượt gọi R2 gói miễn phí, không chạm dữ liệu thật.

## 1. Neon

1. Tạo project, database `toannx`; lấy thông tin kết nối **pooled** (host `...-pooler...`) và đặt `DB_SSLMODE=require`.
2. Tạo branch riêng cho test/preview nếu cần; không chạy test trên branch production.

## 2. Backend (`backend/`)

- `config/wsgi.py` expose WSGI `app`; `vercel.json` build `config/wsgi.py` bằng `@vercel/python` và route mọi path vào đó (cần xác minh khi deploy thật).
- Dependencies: `pyproject.toml` + `uv.lock`; `requirements.txt` được sinh bằng
  `uv export --no-dev --no-hashes -o requirements.txt` cho runtime đọc requirements (chạy lại khi đổi dependency).
- Không phụ thuộc filesystem, bộ nhớ hay worker. File lưu ở object storage (`FILE_STORAGE_BACKEND`).
  Swagger chỉ bật khi DEBUG (asset CDN).
- Dọn dữ liệu: `vercel.json` khai Vercel Cron gọi `GET /api/v1/system/health/cleanup` lúc 03:00 UTC mỗi ngày; Vercel tự gửi
  `Authorization: Bearer <CRON_SECRET>`. Cron chạy mọi `cleanup_tasks` của module: phiên/token/bucket hết hạn,
  journal quá `JOURNAL_RETENTION_DAYS`, file của tệp đã xóa mềm và file mồ côi quá `ATTACHMENT_PURGE_DAYS`,
  gửi nốt thông báo (`dispatch_notifications`), dọn thông báo cũ (`purge_notifications`).
- Health check ngoài (cấu hình ngoài repo): gọi `GET /api/v1/system/health` **mỗi 10 phút** (0 SQL, 0 Redis); chỉ gọi `/api/v1/system/health/ready` để kiểm kết nối DB sau deploy hoặc theo sự kiện.
- Workspace Cron (`cron-job.org` kèm `Authorization: Bearer <CRON_SECRET>`): `POST /api/v1/workspace/cron/tick` **mỗi 15 phút** (đã cấu hình ngoài — chỉ đọc mốc Redis W4 `workspace:cron:alerts_next_due`, 0 SQL khi chưa đến hạn). Endpoint `POST /api/v1/workspace/cron/dispatch-due` **chạy qua QStash theo sự kiện** khi có lịch nhắc/cảnh báo/digest sắp tới (không cấu hình cron định kỳ 15 phút để Neon Scale-to-Zero).
- Bot Telegram chung & AI (`backend/.env`): cấu hình `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` (webhook secret tự dẫn xuất HMAC từ `DJANGO_SECRET_KEY`, không cần biến riêng), `XKIRO_API_BASE`, `XKIRO_API_KEY`, `XKIRO_MODEL`, `XKIRO_FALLBACK_MODELS`, `XKIRO_TIMEOUT_SECONDS`, `XKIRO_COOLDOWN_SECONDS`, `GEMINI_API_KEY`, `GEMINI_EMBEDDING_MODEL` (embedding trí nhớ Trợ lý; Neon tự có extension `vector`, migration tự `CREATE EXTENSION`).
- **Cron gửi thông báo** (Vercel Cron chỉ 1 lần/ngày): tạo job miễn phí ở cron-job.org gọi
  `POST https://api.toannx.com/api/v1/system/notifications/dispatch` **mỗi 10 phút** (lưới an toàn; QStash gửi ngay), header
  `Authorization: Bearer <CRON_SECRET>`. Xem [notification-setup-guide.md](notification-setup.md).
- **Webhook SePay theo từng người**: mỗi người dùng tự cấu hình ở Tài chính → Kết nối SePay (token API lưu DB mã
  hóa, URL `https://api.toannx.com/api/v1/finance/sepay/webhook/<mã riêng>`, secret riêng). Không còn biến env
  token/secret SePay. Xem [finance-setup-guide.md](finance-setup.md).
- **Đổi `DJANGO_SECRET_KEY`** làm mất hiệu lực token SePay, mục Két sắt `VaultItem` (mã hóa bằng `SecretCipher`), webhook secret dẫn xuất và secret
  webhook SePay (dẫn xuất): mọi người phải nhập lại token và dán secret mới vào SePay.

Biến môi trường (Vercel → Settings → Environment Variables):

| Biến | Giá trị production |
| --- | --- |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_SECRET_KEY` | chuỗi ngẫu nhiên ≥ 50 ký tự; secret chung (Django, ký JWT, HMAC refresh token) |
| `DATABASE_URL` | PostgreSQL connection URL (Neon host pooled `...-pooler...` với `sslmode=require&channel_binding=require` hoặc direct host) |
| `DB_CONN_MAX_AGE` | `0` (serverless + pooler) |
| `REDIS_URL` | Upstash Redis TCP (`rediss://...`), do integration Upstash của Vercel tự tạo; trống thì không cache công khai và rate limit đếm bằng PostgreSQL. Xem [infrastructure.md](../architecture/infrastructure.md) |
| `DJANGO_ALLOWED_HOSTS` | `toannx.com,api.toannx.com,<project>.vercel.app` (gồm cả domain frontend, xem dưới) |
| `CSRF_TRUSTED_ORIGINS` | `https://toannx.com` |
| `AUTH_ACCESS_TOKEN_LIFETIME_SECONDS` | `600` |
| `AUTH_REFRESH_TOKEN_LIFETIME_SECONDS` | `604800` |
| `CRON_SECRET` | chuỗi ngẫu nhiên; trống thì endpoint dọn dẹp và cron gửi thông báo trả 404 |
| `JOURNAL_RETENTION_DAYS` / `ATTACHMENT_PURGE_DAYS` | `365` / `30` |
| `ATTACHMENT_MAX_TOTAL_STORAGE_BYTES` | `9663676416` (9GB; chi tiết xem [cloudflare-r2.md](cloudflare-r2.md)) |
| `CLOUDFLARE_R2_PRIVATE_BUCKET_NAME` | Bucket R2 **không bật public access** cho file riêng tư (chứng từ). Thiếu khi đang dùng R2 thì upload riêng tư bị từ chối. Dùng chung access key với bucket công khai (key phải có quyền cả hai bucket) |
| `ATTACHMENT_PRIVATE_URL_TTL_SECONDS` | Hạn link ký tới file riêng tư (mặc định 300 giây) |
| `CLOUDFLARE_API_TOKEN` | Token quyền `Account: R2 Read` đo dung lượng thực tế (xem [cloudflare-r2.md](cloudflare-r2.md)) |
| `SEPAY_ENV` | `sandbox` (Test mode) hoặc `production`; token/secret SePay là của từng người (không ở env) |
| `FIREBASE_PROJECT_ID` | Project Firebase cho thông báo trình duyệt; trống thì tắt kênh "Trình duyệt" |
| `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64` | **Bí mật**: service account JSON (base64 một dòng) để gọi FCM HTTP v1 |
| `QSTASH_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` | Upstash QStash (integration Vercel tạo). **Bí mật** trừ URL. Trống `QSTASH_TOKEN` thì thông báo chỉ gửi khi cron chạy. Xem [notification-setup.md](notification-setup.md) |
| `DB_CONNECT_TIMEOUT` | `10` (giây chờ kết nối; Neon đang ngủ cần vài giây để thức) |
| `DATABASE_MAX_BYTES` | `1073741824` (Neon free 1 GB); cron dọn dẹp cảnh báo khi dùng từ 80%, `0` = tắt |
| `EMAIL_ASYNC` / `EMAIL_TIMEOUT` | `False` / `5`: gửi thư theo mẫu đồng bộ (luồng nền bị dừng trên Vercel làm mất thư), chặn treo SMTP |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_BOT_USERNAME` | **Bí mật** token Bot Telegram dùng chung toàn hệ thống (lấy từ @BotFather) và `@username` tùy chọn (tự lấy qua `getMe` nếu trống) |
| `XKIRO_API_BASE` / `XKIRO_API_KEY` | Endpoint OpenAI-compatible và khóa API bí mật cho Trợ lý AI Workspace |
| `GEMINI_API_KEY` / `GEMINI_EMBEDDING_MODEL` | Khóa Google Gemini (gói free) và model embedding (`gemini-embedding-001`, 768 chiều) cho trí nhớ Trợ lý AI; trống key → chỉ tìm full-text |
| `XKIRO_MODEL` / `XKIRO_FALLBACK_MODELS` / `XKIRO_TIMEOUT_SECONDS` / `XKIRO_COOLDOWN_SECONDS` | Model AI mặc định, danh sách model fallback (phân tách dấu phẩy), timeout mỗi lượt (`1..5s`, mặc định `4.5`) và thời gian tạm né model lỗi trong Redis (`120s`) |

Frontend (project Vercel của FE): `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`,
`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (công khai).

Backend luôn đứng sau proxy (Next rewrite / Vercel) và bật `USE_X_FORWARDED_HOST` + `SECURE_PROXY_SSL_HEADER`
để dựng URL tuyệt đối (file, icon) theo đúng domain trình duyệt đang dùng. Vì vậy host được Django kiểm tra là
`X-Forwarded-Host` (domain frontend, ví dụ `toannx.com`): domain này **phải** có trong `DJANGO_ALLOWED_HOSTS`,
nếu không request trả 400. Không expose backend trực tiếp ra Internet khi không có proxy tin cậy phía trước.

## 3. Migration an toàn

Hệ thống đã được cấu hình **tự động chạy migration khi build trên Vercel** thông qua `backend/build_files.sh`
và `[tool.vercel.scripts].build` trong `backend/pyproject.toml`.

- Khi Vercel build Backend, script sẽ tự động chạy:
  `DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}" python manage.py migrate --noinput`
- Khuyến nghị cấu hình thêm biến `DATABASE_URL_UNPOOLED` trên Vercel Environment Variables (trỏ trực tiếp tới host
  Neon direct, không qua pgbouncer pooler `-pooler`) để các lệnh DDL migration không bị hạn chế bởi connection pooling.
- Nếu không cấu hình `DATABASE_URL_UNPOOLED`, script sẽ fallback dùng `DATABASE_URL`.

Nếu cần chạy thủ công từ máy tin cậy (hoặc CI) trước khi promote deployment:

```bash
cd backend
DATABASE_URL="postgresql://user:password@<neon-direct-host>:5432/toannx?sslmode=require&channel_binding=require" DJANGO_SECRET_KEY=x \
  uv run python manage.py migrate --plan     # xem trước
DATABASE_URL=... uv run python manage.py migrate          # áp dụng + đồng bộ quyền (dùng direct URL)
DATABASE_URL=... uv run python manage.py createsuperuser
```

Dùng **direct** connection (không pooler) cho migration. Migration phải tương thích ngược với bản đang chạy
(thêm cột nullable trước, xóa sau) vì Vercel chuyển traffic theo deployment.

## 4. Frontend (`frontend/`)

| Biến | Giá trị |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://api.toannx.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://toannx.com` |

Framework preset Next.js, install `pnpm install`, build `pnpm build`.

## 5. Kiểm tra sau deploy

```bash
curl -s https://toannx.com/api/v1/system/health/ready      # {"success":true,"data":{"status":"ready"}...}
curl -sI https://toannx.com/vi/quan-tri              # 307 → /vi/dang-nhap?next=...
```

Đăng nhập, kiểm tra cookie `access_token`/`refresh_token`/`session_hint` có `Secure; HttpOnly`, host `toannx.com`.

## Rủi ro và kiến trúc mạng

- **Kiến trúc gọi API trực tiếp (Browser → Backend API)**: Trình duyệt tại `toannx.com` gọi trực tiếp sang `https://api.toannx.com`
  (thông qua `NEXT_PUBLIC_API_URL` và `apiClient` với `credentials: "include"`). Không đi qua Next.js rewrite để Cloudflare
  của `api.toannx.com` nhận diện chính xác IP thật của người dùng (`CF-Connecting-IP`), tránh bị Vercel Frontend Serverless
  làm trung gian che khuất IP client gốc.
- **Cookie phiên và CSRF cross-subdomain**:
  - `access_token` và `refresh_token` là host-only trên `api.toannx.com` (`SameSite=Lax/Strict`, `HttpOnly`).
  - `session_hint` được cấu hình `domain=.toannx.com` qua `AUTH_COOKIE_DOMAIN` để Next.js proxy trên `toannx.com` đọc được cờ phiên.
  - `CSRF`: Token được `apiClient` lấy tự động từ `GET /api/v1/system/auth/csrf`, lưu in-memory và gửi kèm header `X-CSRFToken`.
- **CORS**: Backend cho phép origins qua `CORS_ALLOWED_ORIGINS` (production: `https://toannx.com,https://www.toannx.com`), preview deployments qua `CORS_ALLOWED_ORIGIN_REGEXES`.
- **Content Security Policy (CSP)**: Khai báo trong `frontend/next.config.ts`, `connect-src` bao gồm origin của API (`NEXT_PUBLIC_API_URL`).
- Lỗi trình duyệt đi qua `/api/v1/system/health/client-errors` để ghi log mức ERROR ở BE.
