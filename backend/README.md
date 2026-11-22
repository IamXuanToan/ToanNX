# ToanNX backend

Django 6 + DRF, PostgreSQL. Một file cấu hình `config/settings.py` (biến môi trường).

```bash
cp .env.example .env
uv sync
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py runserver 8001
```

| Lệnh | Mục đích |
| --- | --- |
| `uv run ruff format .` / `uv run ruff check .` | Format / lint |
| `uv run mypy .` | Kiểm tra kiểu |
| `uv run pytest -q` | Test (DB `test_toannx`) |
| `uv run python manage.py sync_iam` | Đồng bộ quyền/vai trò hệ thống |

Xem [../AGENTS.md](../AGENTS.md), [../docs/architecture/architecture.md](../docs/architecture/architecture.md).
