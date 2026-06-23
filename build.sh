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

echo "==> Seeding demo data (if needed)..."
python manage.py populate_mock_data
python manage.py seed_dashboard
python manage.py fix_missing_addresses
python manage.py populate_render_review_data --polizas 100 --firmas 20 --skip-if-exists

echo "==> Build complete."
