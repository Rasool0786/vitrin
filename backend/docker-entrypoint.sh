#!/bin/sh

set -e

echo "==> Running deployment checks..."

python manage.py check --deploy


echo "==> Running migrations..."

python manage.py migrate --noinput


echo "==> Collecting static files..."

python manage.py collectstatic --noinput


echo "==> Starting Gunicorn..."

exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-2}" \
    --timeout 60 \
    --access-logfile - \
    --error-logfile -
