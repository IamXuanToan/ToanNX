# TOANNX

Website cá nhân **toannx.com** — monorepo gồm:

| Thư mục     | Công nghệ                                                             | Deploy                   |
| ----------- | --------------------------------------------------------------------- | ------------------------ |
| `backend/`  | Python 3.13, Django 6.0, DRF 3.18, PostgreSQL (psycopg 3), PyJWT, uv | Vercel → `api.toannx.com` |
| `frontend/` | Next.js 16 (App Router), React 19, TypeScript strict, Tailwind 4, shadcn/ui (Radix), TanStack Query, Zustand, next-intl, pnpm | Vercel → `toannx.com` |
| `docs/`     | Tài liệu kiến trúc, xác thực, phân quyền, i18n, deploy, test          | —                        |
| `scripts/`  | `check-all.sh` / `check-all.ps1`                                      | —                        |

Phạm vi hiện tại: **foundation** (IAM, xác thực, module registry, i18n vi/en, layout admin/public, design system) và backend cho `short_links`, `custom_pages`. QR là block của Custom Pages; frontend cho hai module nội dung chưa triển khai. Analytics, Novel và CMS chưa có module nghiệp vụ.

## Yêu cầu

- Python 3.13 + [uv](https://docs.astral.sh/uv/)
- Node.js 22+ + pnpm
- PostgreSQL 16+ (local hoặc Docker; production dùng Neon)

## Chạy local

### 0. Git

```bash
git config core.hooksPath .githooks   # bật kiểm tra tên commit/nhánh (docs/rules/git.md)
```

### 1. Database

```bash
# PostgreSQL local (ví dụ user postgres):
psql -U postgres -c "CREATE DATABASE toannx ENCODING 'UTF8';"
# Hoặc Docker:
docker run -d --name toannx-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:18
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # điền DJANGO_SECRET_KEY, DB_USER/DB_PASSWORD (DB_*), DJANGO_DEBUG=True
uv sync
uv run python manage.py migrate          # tạo bảng + đồng bộ quyền/vai trò hệ thống
uv run python manage.py createsuperuser  # nhập email + mật khẩu
uv run python manage.py runserver 8000
```

Sinh secret: `uv run python -c "import secrets; print(secrets.token_urlsafe(50))"`.
API docs (chỉ khi `DJANGO_DEBUG=True`): http://localhost:8000/api/v1/docs

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local   # BACKEND_ORIGIN=http://localhost:8000
pnpm install
pnpm dev                     # http://localhost:3000 → /vi
```

Đăng nhập tại http://localhost:3000/vi/dang-nhap bằng superuser vừa tạo.

## Kiểm tra

```bash
./scripts/check-all.sh          # hoặc: pwsh scripts/check-all.ps1
cd frontend && pnpm e2e         # E2E Playwright (tự khởi động server nếu chưa chạy)
```

Chi tiết: [docs/testing.md](docs/testing.md).

## Tài liệu

- [SYSTEM_CONTEXT.md](SYSTEM_CONTEXT.md) — bối cảnh hệ thống, quyết định đã chốt
- [AGENTS.md](AGENTS.md) — quy tắc phát triển (người và AI agent)
- [docs/architecture.md](docs/architecture.md) · [docs/authentication.md](docs/authentication.md) · [docs/authorization.md](docs/authorization.md)
- [docs/i18n.md](docs/i18n.md) · [docs/deployment.md](docs/deployment.md) · [docs/testing.md](docs/testing.md)
- [docs/reference-audit.md](docs/reference-audit.md) — đánh giá source tham khảo PMS/Medoly
- [docs/reports/foundation-report.html](docs/reports/foundation-report.html) — báo cáo foundation
