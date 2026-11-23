#!/bin/bash
set -e

echo "==> [Vercel Build] Bắt đầu chạy database migrations..."

# Ưu tiên DATABASE_URL_UNPOOLED (direct connection của Neon không qua pooler) nếu có,
# nếu không có thì dùng DATABASE_URL.
MIGRATE_DB_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"

if [ -n "$MIGRATE_DB_URL" ]; then
  DATABASE_URL="$MIGRATE_DB_URL" python manage.py migrate --noinput
  echo "==> [Vercel Build] Database migrations hoàn tất thành công."
else
  echo "==> [Vercel Build] CẢNH BÁO: Chưa cấu hình DATABASE_URL hoặc DATABASE_URL_UNPOOLED. Bỏ qua migrate."
fi
