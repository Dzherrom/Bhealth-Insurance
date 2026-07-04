#!/usr/bin/env bash
# Lumina Insurance — apply VPS localhost redirect fix + env + rebuild
# Run on VPS as deploy (requires sudo password once):
#   bash deploy/scripts/apply-vps-fix.sh
set -o errexit
set -o pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"
PUBLIC_IP="${PUBLIC_IP:-2.25.68.83}"

echo "==> Recovering ownership for deploy user..."
sudo chown -R deploy:deploy "${ROOT_DIR}"

echo "==> Preserving backend/.env and pulling latest code..."
cp backend/.env /tmp/lumina-backend.env.bak
git stash push -q -m "deploy-env-$(date +%s)" backend/.env 2>/dev/null || true
git checkout -- deploy/README.md 2>/dev/null || true
if git pull origin main; then
  echo "    git pull OK"
else
  echo "    WARN: git pull failed — applying local patches if present"
fi
cp /tmp/lumina-backend.env.bak backend/.env

PATCH_DIR="${ROOT_DIR}/deploy/patches"
if [[ -d "${PATCH_DIR}" ]]; then
  echo "==> Applying frontend patches from ${PATCH_DIR}..."
  for f in middleware.ts requestOrigin.ts middlewareAccess.ts; do
    if [[ -f "${PATCH_DIR}/${f}" ]]; then
      if [[ "${f}" == "middleware.ts" ]]; then
        cp "${PATCH_DIR}/${f}" frontend/middleware.ts
      else
        cp "${PATCH_DIR}/${f}" "frontend/lib/${f}"
      fi
      echo "    patched ${f}"
    fi
  done
fi

echo "==> Fixing populate_full_demo_data (Poliza.etiquetas guard)..."
sed -i "s/if etiquetas_poliza:/if etiquetas_poliza and hasattr(poliza, 'etiquetas'):/" \
  backend/api/management/commands/populate_full_demo_data.py 2>/dev/null || true

echo "==> Writing frontend/.env.production..."
cat > frontend/.env.production <<EOF
NEXT_PUBLIC_SITE_URL=http://${PUBLIC_IP}
EOF

echo "==> Backend: migrate + sync super-admin password from .env..."
source venv/bin/activate
pip install -r requirements.txt -q
cd backend
python manage.py migrate --noinput
python manage.py ensure_crm_admin --update-password
python manage.py populate_full_demo_data --skip-if-exists || echo "WARN: populate_full_demo_data skipped or failed"
cd ..

echo "==> Frontend: clean build with public site URL..."
cd frontend
npm ci
npm run build
cd ..

echo "==> Restoring service ownership..."
sudo chown deploy:www-data backend/.env
sudo chmod 640 backend/.env
sudo chown -R www-data:www-data frontend
sudo chown -R www-data:www-data backend/media backend/staticfiles 2>/dev/null || true

echo "==> Updating Nginx (proxy_redirect + reload)..."
sudo cp deploy/nginx/lumina-insurance.conf /etc/nginx/sites-available/lumina-insurance
sudo ln -sf /etc/nginx/sites-available/lumina-insurance /etc/nginx/sites-enabled/lumina-insurance
sudo nginx -t
sudo systemctl restart lumina-backend lumina-frontend
sudo systemctl reload nginx

echo "==> Verifying CRM redirect..."
LOCATION="$(curl -s -D - -o /dev/null "http://${PUBLIC_IP}/crm/dashboard" | grep -i '^location:' | head -1 | tr -d '\r')"
echo "    ${LOCATION:-no redirect header}"
if echo "${LOCATION}" | grep -qiE 'localhost|127\.0\.0\.1:3000'; then
  echo "FAIL: still redirecting to localhost"
  exit 1
fi

echo "==> ALL FIXES APPLIED SUCCESSFULLY ==="
