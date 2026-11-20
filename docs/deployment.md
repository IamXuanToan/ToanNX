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

## 1. Neon

1. Tạo project, database `toannx`; lấy thông tin kết nối **pooled** (host `...-pooler...`) và đặt `DB_SSLMODE=require`.
2. Tạo branch riêng cho test/preview nếu cần; không chạy test trên branch production.

## 2. Backend (`backend/`)

- `config/wsgi.py` expose WSGI `app`; `vercel.json` build `config/wsgi.py` bằng `@vercel/python` và route mọi path vào đó (cần xác minh khi deploy thật).
- Dependencies: `pyproject.toml` + `uv.lock`; `requirements.txt` được sinh bằng
  `uv export --no-dev --no-hashes -o requirements.txt` cho runtime đọc requirements (chạy lại khi đổi dependency).
- Không phụ thuộc filesystem, bộ nhớ hay worker. File lưu ở object storage (`FILE_STORAGE_BACKEND`).
  Swagger chỉ bật khi DEBUG (asset CDN).
- Dọn dữ liệu: `vercel.json` khai Vercel Cron gọi `GET /api/v1/health/cleanup` lúc 03:00 UTC mỗi ngày; Vercel tự gửi
  `Authorization: Bearer <CRON_SECRET>`. Cron chạy mọi `cleanup_tasks` của module: phiên/token/bucket hết hạn,
  journal quá `JOURNAL_RETENTION_DAYS`, file của tệp đã xóa mềm và file mồ côi quá `ATTACHMENT_PURGE_DAYS`.

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
| `SENTRY_DSN` | DSN project Sentry (trống = tắt báo lỗi, chi tiết xem [sentry.md](sentry.md)) |
| `SENTRY_ENVIRONMENT` / `SENTRY_TRACES_SAMPLE_RATE` | `production` / `0` |

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
curl -s https://toannx.com/api/v1/health/ready      # {"success":true,"data":{"status":"ready"}...}
curl -sI https://toannx.com/vi/quan-tri              # 307 → /vi/dang-nhap?next=...
```

Đăng nhập, kiểm tra cookie `access_token`/`refresh_token`/`session_hint` có `Secure; HttpOnly`, host `toannx.com`.

## Rủi ro đã biết

- IP client sau 2 lớp proxy (Vercel frontend → Vercel backend): rate limit theo IP dùng phần tử cuối
  `X-Forwarded-For`; cần xác minh trên Vercel thật. Giới hạn đăng nhập vẫn có khóa theo email.
- Content Security Policy (khai trong `frontend/next.config.ts`) cho phép script inline do Next sinh (không dùng
  nonce để giữ trang tĩnh), ảnh `https:` và iframe YouTube. Thêm dịch vụ ngoài (analytics, font CDN) phải sửa CSP.
- Báo lỗi Sentry chỉ ở BE; lỗi trình duyệt đi qua `/api/v1/health/client-errors` (log ERROR → Sentry).
