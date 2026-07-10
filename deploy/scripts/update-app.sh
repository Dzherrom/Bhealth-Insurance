#!/usr/bin/env bash
# Lumina Insurance — pull latest code and redeploy (step 12+)
set -o errexit
set -o pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

echo "==> Recovering ownership for deploy user..."
sudo chown -R deploy:deploy "${ROOT_DIR}"

echo "==> Preserving backend/.env before git pull..."
cp backend/.env /tmp/lumina-backend.env.bak

echo "==> git pull..."
git pull
cp /tmp/lumina-backend.env.bak backend/.env

echo "==> Backend: dependencies, migrate, static..."
source venv/bin/activate
pip install -r requirements.txt
cd backend
python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py ensure_crm_admin 2>/dev/null || true
cd ..

echo "==> Frontend: build..."
cd frontend
if [[ ! -f .env.production ]]; then
  cp .env.production.example .env.production
fi
npm ci
npm run build
cd ..

echo "==> Restoring service ownership..."
sudo chown deploy:www-data backend/.env
sudo chmod 640 backend/.env
sudo chown -R www-data:www-data frontend
sudo chown -R www-data:www-data backend/media backend/staticfiles

echo "==> Restarting services..."
sudo systemctl restart lumina-backend lumina-frontend
sudo systemctl reload nginx

echo "==> Done. Run: bash deploy/scripts/verify-deploy.sh"
