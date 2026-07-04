#!/usr/bin/env bash
# Full VPS deploy fix — run with: SUDO_PASS='***' bash /tmp/lumina-full-deploy.sh
set -o errexit
set -o pipefail

ROOT=/var/www/Bhealth-Insurance
PUBLIC_IP=2.25.68.83
SUDO_PASS="${SUDO_PASS:?Set SUDO_PASS}"

sudo_cmd() {
  echo "$SUDO_PASS" | sudo -S "$@"
}

echo "=== 1. Ownership ==="
sudo_cmd chown -R deploy:deploy "$ROOT"

echo "=== 2. Fix backend/.env (local PostgreSQL) ==="
DB_PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
sudo_cmd -u postgres psql -c "ALTER USER lumina_administrator PASSWORD '${DB_PASS}';" >/dev/null
ENC_DB_PASS="$(python3 -c "import urllib.parse; print(urllib.parse.quote('${DB_PASS}', safe=''))")"
SECRET_KEY="$(openssl rand -base64 48)"
ADMIN_PASS="${DJANGO_SUPERUSER_PASSWORD:-Carabobo26.*}"

cat > "$ROOT/backend/.env" <<EOF
SECRET_KEY=${SECRET_KEY}
DEBUG=False
DATABASE_URL=postgresql://lumina_administrator:${ENC_DB_PASS}@localhost:5432/lumina_db
BACKEND_PUBLIC_URL=http://${PUBLIC_IP}
FRONTEND_ORIGINS=http://${PUBLIC_IP}
ALLOWED_HOSTS=${PUBLIC_IP},srv1781611.hstgr.cloud
DJANGO_SUPERUSER_USERNAME=lumina-admin
DJANGO_SUPERUSER_EMAIL=admin@lumina.local
DJANGO_SUPERUSER_PASSWORD=${ADMIN_PASS}
EOF
chmod 640 "$ROOT/backend/.env"

echo "=== 3. Python venv ==="
if [[ ! -x "$ROOT/venv/bin/python" ]]; then
  python3 -m venv "$ROOT/venv"
fi
source "$ROOT/venv/bin/activate"
pip install -q -r "$ROOT/requirements.txt"

echo "=== 4. Backend migrate + admin ==="
cd "$ROOT/backend"
python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py shell <<'PY'
import os
from pathlib import Path
from django.contrib.auth.models import User
for line in Path('.env').read_text().splitlines():
    if '=' in line and not line.strip().startswith('#'):
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip())
pwd = os.environ.get('DJANGO_SUPERUSER_PASSWORD', '')
user = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'lumina-admin')
u, _ = User.objects.get_or_create(username=user, defaults={'email': 'admin@lumina.local', 'is_staff': True, 'is_superuser': True, 'is_active': True})
u.set_password(pwd)
u.is_staff = u.is_superuser = u.is_active = True
u.save()
print('admin ready:', user)
PY
cd "$ROOT"

echo "=== 5. Frontend .env.production + build ==="
cat > "$ROOT/frontend/.env.production" <<EOF
NEXT_PUBLIC_SITE_URL=http://${PUBLIC_IP}
EOF
cd "$ROOT/frontend"
npm ci --prefer-offline 2>&1 | tail -3
NEXT_PUBLIC_SITE_URL="http://${PUBLIC_IP}" npm run build 2>&1 | tail -8
cd "$ROOT"

echo "=== 6. Nginx proxy_redirect + X-Forwarded-Host ==="
sudo_cmd cp "$ROOT/deploy/nginx/lumina-insurance.conf" /etc/nginx/sites-available/lumina
sudo_cmd ln -sf /etc/nginx/sites-available/lumina /etc/nginx/sites-enabled/lumina
sudo_cmd rm -f /etc/nginx/sites-enabled/default
sudo_cmd nginx -t

echo "=== 7. Permissions + restart ==="
sudo_cmd chown deploy:www-data "$ROOT/backend/.env"
sudo_cmd chmod 640 "$ROOT/backend/.env"
sudo_cmd chown -R www-data:www-data "$ROOT/frontend"
sudo_cmd chown -R www-data:www-data "$ROOT/backend/media" "$ROOT/backend/staticfiles" 2>/dev/null || true
sudo_cmd systemctl restart lumina-backend lumina-frontend
sudo_cmd systemctl reload nginx

echo "=== 8. Verification ==="
echo -n "CRM redirect: "
curl -s -I "http://${PUBLIC_IP}/crm/dashboard" | grep -i '^location:' | tr -d '\r' || echo "(none)"
echo -n "API root: "
curl -s -o /dev/null -w "HTTP %{http_code}\n" "http://${PUBLIC_IP}/api/"
python3 <<'PY'
import json, os, urllib.request
from pathlib import Path
for line in Path('/var/www/Bhealth-Insurance/backend/.env').read_text().splitlines():
    if '=' in line and not line.strip().startswith('#'):
        k,v=line.split('=',1); os.environ.setdefault(k.strip(),v.strip())
data=json.dumps({'username':os.environ['DJANGO_SUPERUSER_USERNAME'],'password':os.environ['DJANGO_SUPERUSER_PASSWORD']}).encode()
req=urllib.request.Request('http://127.0.0.1:8000/api/login/', data=data, headers={'Content-Type':'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        print('login: OK', r.status)
except Exception as e:
    print('login: FAIL', getattr(e,'code',e))
PY
echo "=== DONE ==="
