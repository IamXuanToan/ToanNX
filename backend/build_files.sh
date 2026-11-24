
#!/usr/bin/env bash
set -euo pipefail

echo "==> [Vercel Build] Running Django migrations..."

python manage.py migrate --noinput

echo "==> [Vercel Build] Migrations completed successfully."
