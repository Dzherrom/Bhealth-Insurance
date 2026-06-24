#!/usr/bin/env bash
set -o errexit
set -o pipefail

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT_DIR}/backend"

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Running database migrations..."
python manage.py migrate --noinput

echo "==> Seeding full demo dataset (if needed)..."
python manage.py populate_full_demo_data --polizas 100 --quotes 12 --skip-if-exists

echo "==> Build complete."
