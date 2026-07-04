#!/usr/bin/env bash
set -o errexit
set -o pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT_DIR}/backend"

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Running database migrations..."
python manage.py migrate --noinput

echo "==> Ensuring CRM super-admin (SUPER_ADMIN role)..."
export DJANGO_SUPERUSER_USERNAME="${DJANGO_SUPERUSER_USERNAME:-lumina-admin}"
export DJANGO_SUPERUSER_EMAIL="${DJANGO_SUPERUSER_EMAIL:-admin@lumina.local}"
export DJANGO_SUPERUSER_PASSWORD="${DJANGO_SUPERUSER_PASSWORD:-Caracas25.*}"
python manage.py ensure_crm_admin

echo "==> Seeding full demo dataset (if needed)..."
python manage.py populate_full_demo_data --polizas 100 --quotes 12 --skip-if-exists

echo "==> Starting gunicorn on 0.0.0.0:${PORT:-8000} (workers: ${WEB_CONCURRENCY:-1})..."
exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${WEB_CONCURRENCY:-1}" \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
