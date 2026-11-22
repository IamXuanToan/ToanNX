# Triển khai (Vercel + Neon)

Trạng thái: **READY** (cấu hình đã có, build production đã chạy thành công local).
**Chưa DEPLOYED** — chưa có credentials Vercel/Neon.

## Kiến trúc

| Project Vercel | Root directory | Domain |
| --- | --- | --- |
| `toannx-frontend` | `frontend/` | `toannx.com` |
| `toannx-backend` | `backend/` | `api.toannx.com` |

Frontend rewrite `/api/v1/*` → `${BACKEND_ORIGIN}/api/v1/*` (Vercel external rewrite, header `Set-Cookie`
được chuyển nguyên). Trình duyệt chỉ thấy `toannx.com` ⇒ cookie host-only, không cần CORS, không cần cookie
`Domain=.toannx.com`. Có thể gọi trực tiếp `api.toannx.com` bằng `Authorization: Bearer` (không CSRF).

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
- **Cron gửi thông báo** (Vercel Cron chỉ 1 lần/ngày): tạo job miễn phí ở cron-job.org gọi
  `POST https://api.toannx.com/api/v1/system/notifications/dispatch` mỗi 1–5 phút, header
  `Authorization: Bearer <CRON_SECRET>`. Xem [notification-setup-guide.md](notification-setup.md).
- **Webhook SePay theo từng người**: mỗi người dùng tự cấu hình ở Tài chính → Kết nối SePay (token API lưu DB mã
  hóa, URL `https://api.toannx.com/api/v1/finance/sepay/webhook/<mã riêng>`, secret riêng). Không còn biến env
  token/secret SePay. Xem [finance-setup-guide.md](finance-setup.md).
- **Đổi `DJANGO_SECRET_KEY`** làm mất hiệu lực token SePay, token bot Telegram (mã hóa bằng khóa dẫn xuất) và secret
  webhook SePay (dẫn xuất): mọi người phải nhập lại token và dán secret mới vào SePay.

Biến môi trường (Vercel → Settings → Environment Variables):

| Biến | Giá trị production |
| --- | --- |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_SECRET_KEY` | chuỗi ngẫu nhiên ≥ 50 ký tự; secret chung (Django, ký JWT, HMAC refresh token) |
| `DATABASE_URL` | PostgreSQL connection URL (Neon host pooled `...-pooler...` với `sslmode=require&channel_binding=require` hoặc direct host) |
| `DB_CONN_MAX_AGE` | `0` (serverless + pooler) |
| `DJANGO_ALLOWED_HOSTS` | `toannx.com,api.toannx.com,<project>.vercel.app` (gồm cả domain frontend, xem dưới) |
| `CSRF_TRUSTED_ORIGINS` | `https://toannx.com` |
| `AUTH_ACCESS_TOKEN_LIFETIME_SECONDS` | `600` |
| `AUTH_REFRESH_TOKEN_LIFETIME_SECONDS` | `604800` |
| `CRON_SECRET` | chuỗi ngẫu nhiên; trống thì endpoint dọn dẹp trả 404 |
| `JOURNAL_RETENTION_DAYS` / `ATTACHMENT_PURGE_DAYS` | `365` / `30` |
| `ATTACHMENT_MAX_TOTAL_STORAGE_BYTES` | `9663676416` (9GB; chi tiết xem [cloudflare-r2.md](cloudflare-r2.md)) |
| `CLOUDFLARE_R2_PRIVATE_BUCKET_NAME` | Bucket R2 **không bật public access** cho file riêng tư (chứng từ). Thiếu khi đang dùng R2 thì upload riêng tư bị từ chối. Dùng chung access key với bucket công khai (key phải có quyền cả hai bucket) |
| `ATTACHMENT_PRIVATE_URL_TTL_SECONDS` | Hạn link ký tới file riêng tư (mặc định 300 giây) |
| `CLOUDFLARE_API_TOKEN` | Token quyền `Account: R2 Read` đo dung lượng thực tế (xem [cloudflare-r2.md](cloudflare-r2.md)) |
| `SEPAY_ENV` | `sandbox` (Test mode) hoặc `production`; token/secret SePay là của từng người (không ở env) |
| `FIREBASE_PROJECT_ID` | Project Firebase cho thông báo trình duyệt; trống thì tắt kênh "Trình duyệt" |
| `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64` | **Bí mật**: service account JSON (base64 một dòng) để gọi FCM HTTP v1 |
| `NOTIFICATION_DISPATCH_BUDGET_SECONDS` | Giây gửi thông báo ngay sau commit trong một request (mặc định 5) |

Frontend (project Vercel của FE): `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`,
`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (công khai).

Backend luôn đứng sau proxy (Next rewrite / Vercel) và bật `USE_X_FORWARDED_HOST` + `SECURE_PROXY_SSL_HEADER`
để dựng URL tuyệt đối (file, icon) theo đúng domain trình duyệt đang dùng. Vì vậy host được Django kiểm tra là
`X-Forwarded-Host` (domain frontend, ví dụ `toannx.com`): domain này **phải** có trong `DJANGO_ALLOWED_HOSTS`,
nếu không request trả 400. Không expose backend trực tiếp ra Internet khi không có proxy tin cậy phía trước.

## 3. Migration an toàn

Không chạy migration trong request hay khi cold start. Chạy thủ công từ máy tin cậy (hoặc CI) trước khi
promote deployment:

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
| `BACKEND_ORIGIN` | `https://api.toannx.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://toannx.com` |

Framework preset Next.js, install `pnpm install`, build `pnpm build`.

## 5. Kiểm tra sau deploy

```bash
curl -s https://toannx.com/api/v1/system/health/ready      # {"success":true,"data":{"status":"ready"}...}
curl -sI https://toannx.com/vi/quan-tri              # 307 → /vi/dang-nhap?next=...
```

Đăng nhập, kiểm tra cookie `access_token`/`refresh_token`/`session_hint` có `Secure; HttpOnly`, host `toannx.com`.

## Rủi ro đã biết

- IP client sau 2 lớp proxy (Vercel frontend → Vercel backend): rate limit theo IP dùng phần tử cuối
  `X-Forwarded-For`; cần xác minh trên Vercel thật. Giới hạn đăng nhập vẫn có khóa theo email.
- Content Security Policy (khai trong `frontend/next.config.ts`) cho phép script inline do Next sinh (không dùng
  nonce để giữ trang tĩnh), ảnh `https:` và iframe YouTube. Thêm dịch vụ ngoài (analytics, font CDN) phải sửa CSP.
- Lỗi trình duyệt đi qua `/api/v1/system/health/client-errors` để ghi log mức ERROR ở BE.
