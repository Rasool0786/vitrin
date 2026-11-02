#!/bin/sh
set -e

echo "[entrypoint] Starting Vitrin backend..."

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] Waiting for database..."
  python - <<'PY'
import os, sys, time
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")
import django
django.setup()
from django.db import connection

for attempt in range(1, 31):
    try:
        connection.ensure_connection()
        print("[entrypoint] Database is ready.")
        sys.exit(0)
    except Exception as exc:
        print(f"[entrypoint] DB not ready ({attempt}/30): {exc}")
        time.sleep(2)

print("[entrypoint] ERROR: database did not become ready in time.", file=sys.stderr)
sys.exit(1)
PY
fi

mkdir -p /app/logs /app/staticfiles /app/media

echo "[entrypoint] Applying database migrations..."
python manage.py migrate --noinput

echo "[entrypoint] Collecting static files..."
python manage.py collectstatic --noinput --clear

if [ "${SKIP_DEPLOY_CHECK:-0}" != "1" ]; then
  echo "[entrypoint] Running Django deploy checks..."
  python manage.py check --deploy
else
  echo "[entrypoint] Skipping deploy checks (SKIP_DEPLOY_CHECK=1)."
fi

echo "[entrypoint] Handing over to: $@"
exec "$@"
