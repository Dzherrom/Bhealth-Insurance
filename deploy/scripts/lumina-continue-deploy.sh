#!/usr/bin/env bash
set -o errexit
set -o pipefail
ROOT=/var/www/Bhealth-Insurance
PUBLIC_IP=2.25.68.83
SUDO_PASS="${SUDO_PASS:?missing}"

run_sudo() { echo "$SUDO_PASS" | sudo -S "$@"; }

echo "=== Ownership for build ==="
run_sudo chown -R deploy:deploy "$ROOT/frontend"

echo "=== Frontend build ==="
cd "$ROOT/frontend"
npm ci 2>&1 | tail -2
NEXT_PUBLIC_SITE_URL="http://${PUBLIC_IP}" npm run build 2>&1 | tail -12

echo "=== Nginx + restart ==="
run_sudo cp "$ROOT/deploy/nginx/lumina-insurance.conf" /etc/nginx/sites-available/lumina
run_sudo ln -sf /etc/nginx/sites-available/lumina /etc/nginx/sites-enabled/lumina
run_sudo nginx -t
run_sudo chown -R www-data:www-data "$ROOT/frontend"
run_sudo systemctl restart lumina-backend lumina-frontend
run_sudo systemctl reload nginx

echo "=== Verify ==="
curl -s -I "http://${PUBLIC_IP}/crm/dashboard" | grep -i '^location:' | tr -d '\r' || true
curl -s -I "http://${PUBLIC_IP}/crm/polizas" | grep -i '^location:' | tr -d '\r' || true
curl -s -o /dev/null -w "api:%{http_code}\n" "http://${PUBLIC_IP}/api/"
python3 /tmp/test-login-vps.py 2>/dev/null || true
echo DONE
