#!/usr/bin/env bash
set -o errexit
set -o pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT_DIR}/backend"

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Running database migrations..."
python manage.py migrate --noinput

echo "==> Ensuring admin user exists..."
export DJANGO_SUPERUSER_USERNAME="${DJANGO_SUPERUSER_USERNAME:-bhealth-admin}"
export DJANGO_SUPERUSER_EMAIL="${DJANGO_SUPERUSER_EMAIL:-admin@example.com}"
export DJANGO_SUPERUSER_PASSWORD="${DJANGO_SUPERUSER_PASSWORD:-Caracas25.*}"
python manage.py createsuperuser --noinput 2>/dev/null || echo "Admin user already exists."

echo "==> Starting gunicorn on 0.0.0.0:${PORT:-8000} (workers: ${WEB_CONCURRENCY:-1})..."
exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${WEB_CONCURRENCY:-1}" \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
