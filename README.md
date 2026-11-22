# ToanNX

Website cá nhân **toannx.com** — monorepo gồm:

| Thư mục     | Công nghệ                                                             | Deploy                   |
| ----------- | --------------------------------------------------------------------- | ------------------------ |
| `backend/`  | Python 3.13, Django 6.0, DRF 3.18, PostgreSQL (psycopg 3), PyJWT, uv | Vercel → `api.toannx.com` |
| `frontend/` | Next.js 16 (App Router), React 19, TypeScript strict, Tailwind 4, shadcn/ui (Radix), TanStack Query, Zustand, next-intl, pnpm | Vercel → `toannx.com` |
| `docs/`     | Tài liệu kiến trúc, xác thực, phân quyền, i18n, deploy, test          | —                        |
| `scripts/`  | `check-all.sh` / `check-all.ps1`                                      | —                        |

Phạm vi hiện tại: **foundation** (IAM, xác thực, module registry, i18n vi/en, layout admin/public, design system) module **Tiện ích** (`utilities`: link rút gọn, mã QR, trang tùy chỉnh) và Novel.

## Yêu cầu

- Python 3.13 + [uv](https://docs.astral.sh/uv/)
- Node.js 22+ + pnpm
- PostgreSQL 16+ (local hoặc Docker; production dùng Neon)

## Chạy local

**Nhanh (Windows):** sau khi đã cài lần đầu theo các bước bên dưới, chỉ cần chạy

```bat
scripts\dev.bat
```

Script migrate database rồi mở backend (http://localhost:8001) và frontend (http://localhost:3001)
ở 2 cửa sổ riêng. Nếu cổng 8000/3000 đang bị chương trình khác chiếm, script dừng và báo PID để tắt.

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
cp .env.example .env        # điền DJANGO_SECRET_KEY, DATABASE_URL, DJANGO_DEBUG=True
uv sync
uv run python manage.py migrate          # tạo bảng + đồng bộ quyền/vai trò hệ thống
uv run python manage.py createsuperuser  # nhập email + mật khẩu
uv run python manage.py seed_local       # hoặc: local, đồng bộ quyền + superuser mặc định của chủ dự án
uv run python manage.py runserver 8001
```

Sinh secret: `uv run python -c "import secrets; print(secrets.token_urlsafe(50))"`.
API docs (chỉ khi `DJANGO_DEBUG=True`): http://localhost:8001/api/v1/docs

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8001
pnpm install
pnpm dev                     # http://localhost:3001 → /vi
```

Đăng nhập tại http://localhost:3001/vi/dang-nhap bằng superuser vừa tạo.

## Kiểm tra

```bash
./scripts/check-all.sh          # hoặc: pwsh scripts/check-all.ps1
cd frontend && pnpm e2e         # E2E Playwright (tự khởi động server nếu chưa chạy)
```

Chi tiết: [docs/architecture/testing.md](docs/architecture/testing.md).

## Tài liệu

- [SYSTEM_CONTEXT.md](SYSTEM_CONTEXT.md) — bối cảnh hệ thống, quyết định đã chốt
- [AGENTS.md](AGENTS.md) — quy tắc phát triển (người và AI agent)
- [docs/architecture/architecture.md](docs/architecture/architecture.md) · [docs/architecture/authentication.md](docs/architecture/authentication.md) · [docs/architecture/authorization.md](docs/architecture/authorization.md)
- [docs/architecture/i18n.md](docs/architecture/i18n.md) · [docs/guides/deployment.md](docs/guides/deployment.md) · [docs/architecture/testing.md](docs/architecture/testing.md)
- [docs/architecture/reference-audit.md](docs/architecture/reference-audit.md) — đánh giá source tham khảo PMS/Medoly
- [docs/reports/foundation-report.html](docs/reports/foundation-report.html) — báo cáo foundation
