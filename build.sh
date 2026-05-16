#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

cd backend
python manage.py collectstatic --no-input
python manage.py migrate
python manage.py populate_mock_data
python manage.py seed_dashboard
python manage.py fix_missing_addresses
python manage.py populate_render_review_data --polizas 100 --firmas 20 --skip-if-exists

