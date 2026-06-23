#!/usr/bin/env bash
# exit on error
set -o errexit

cd backend
python manage.py migrate
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='bhealth-admin').exists() or User.objects.create_superuser('bhealth-admin', 'admin@example.com', 'Caracas25.*')"
gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${WEB_CONCURRENCY:-1}"
