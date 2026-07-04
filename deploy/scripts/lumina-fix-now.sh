#!/usr/bin/env bash
# Copies pre-built frontend from ~/lumina-frontend-fix + nginx proxy_redirect fix.
# Run on VPS (prompts sudo once):  bash ~/lumina-fix-now.sh
set -o errexit
set -o pipefail

ROOT=/var/www/Bhealth-Insurance
BUILD=~/lumina-frontend-fix
PUBLIC_IP=2.25.68.83

echo "==> sync super-admin password from .env..."
cd "$ROOT/backend" && source ../venv/bin/activate && python manage.py shell <<'PY'
import os
from pathlib import Path
from django.contrib.auth.models import User
for line in Path('.env').read_text().splitlines():
    if '=' in line and not line.strip().startswith('#'):
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip())
pwd = os.environ.get('DJANGO_SUPERUSER_PASSWORD', '')
if pwd:
    u = User.objects.get(username=os.environ.get('DJANGO_SUPERUSER_USERNAME', 'lumina-admin'))
    u.set_password(pwd)
    u.save()
    print('password synced')
PY

echo "==> chown frontend for deploy..."
sudo chown -R deploy:deploy "$ROOT/frontend"

echo "==> sync built frontend..."
rsync -a --delete "$BUILD/.next/" "$ROOT/frontend/.next/"
rsync -a "$BUILD/.env.production" "$ROOT/frontend/.env.production"
cp "$BUILD/middleware.ts" "$ROOT/frontend/middleware.ts"
cp "$BUILD/lib/requestOrigin.ts" "$ROOT/frontend/lib/requestOrigin.ts"
cp "$BUILD/lib/middlewareAccess.ts" "$ROOT/frontend/lib/middlewareAccess.ts"

echo "==> nginx: proxy_redirect + X-Forwarded-Host..."
sudo tee /etc/nginx/sites-available/lumina >/dev/null <<'NGINX'
server {
    listen 80;
    server_name 2.25.68.83 srv1781611.hstgr.cloud;

    client_max_body_size 20M;
    server_tokens off;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    location /media/ {
        alias /var/www/Bhealth-Insurance/backend/media/;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_redirect http://localhost:3000/ http://$host/;
        proxy_redirect http://127.0.0.1:3000/ http://$host/;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/lumina /etc/nginx/sites-enabled/lumina
sudo nginx -t

echo "==> restore ownership + restart..."
sudo chown -R www-data:www-data "$ROOT/frontend"
sudo systemctl restart lumina-backend lumina-frontend
sudo systemctl reload nginx

echo "==> verify CRM redirect..."
curl -s -I "http://${PUBLIC_IP}/crm/dashboard" | grep -i location || true
echo "==> DONE ==="
