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
- Không phụ thuộc filesystem, bộ nhớ, worker hay scheduler. Không có upload file. Swagger chỉ bật khi DEBUG (asset CDN).

Biến môi trường (Vercel → Settings → Environment Variables):

| Biến | Giá trị production |
| --- | --- |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_SECRET_KEY` | chuỗi ngẫu nhiên ≥ 50 ký tự; secret chung (Django, ký JWT, HMAC refresh token) |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | thông tin database Neon |
| `DB_HOST` / `DB_PORT` | host pooled (`...-pooler...`) / `5432` |
| `DB_SSLMODE` | `require` |
| `DB_CONN_MAX_AGE` | `0` (serverless + pooler) |
| `DJANGO_ALLOWED_HOSTS` | `toannx.com,api.toannx.com,<project>.vercel.app` (gồm cả domain frontend, xem dưới) |
| `CSRF_TRUSTED_ORIGINS` | `https://toannx.com` |
| `AUTH_ACCESS_TOKEN_LIFETIME_SECONDS` | `600` |
| `AUTH_REFRESH_TOKEN_LIFETIME_SECONDS` | `604800` |

Backend luôn đứng sau proxy (Next rewrite / Vercel) và bật `USE_X_FORWARDED_HOST` + `SECURE_PROXY_SSL_HEADER`
để dựng URL tuyệt đối (file, icon) theo đúng domain trình duyệt đang dùng. Vì vậy host được Django kiểm tra là
`X-Forwarded-Host` (domain frontend, ví dụ `toannx.com`): domain này **phải** có trong `DJANGO_ALLOWED_HOSTS`,
nếu không request trả 400. Không expose backend trực tiếp ra Internet khi không có proxy tin cậy phía trước.

## 3. Migration an toàn

Không chạy migration trong request hay khi cold start. Chạy thủ công từ máy tin cậy (hoặc CI) trước khi
promote deployment:

```bash
cd backend
DB_HOST=<neon-direct-host> DB_NAME=toannx DB_USER=... DB_PASSWORD=... DB_SSLMODE=require DJANGO_SECRET_KEY=x \
  uv run python manage.py migrate --plan     # xem trước
DB_HOST=... uv run python manage.py migrate          # áp dụng + đồng bộ quyền (cùng bộ biến DB_*)
DB_HOST=... uv run python manage.py createsuperuser
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
- Bảng `auth_session`/`auth_refresh_token`/`auth_rate_limit_bucket` chưa có job dọn dữ liệu cũ (cần cron ở phase sau).
