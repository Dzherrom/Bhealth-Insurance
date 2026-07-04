#!/usr/bin/env bash
# One-shot VPS fix — run in your SSH session (will prompt for sudo password once):
#   bash /home/deploy/lumina-apply-fix.sh
set -o errexit
set -o pipefail

ROOT=/var/www/Bhealth-Insurance
PUBLIC_IP=2.25.68.83

echo "=== Lumina frontend + nginx fix ==="
sudo chown -R deploy:deploy "$ROOT"

# Patches uploaded earlier; apply if present
for f in middleware.ts requestOrigin.ts middlewareAccess.ts; do
  src="$ROOT/deploy/patches/$f"
  [[ -f "$src" ]] || src="/tmp/lumina-fix-upload/$f"
  if [[ -f "$src" ]]; then
    if [[ "$f" == "middleware.ts" ]]; then
      cp "$src" "$ROOT/frontend/middleware.ts"
    else
      cp "$src" "$ROOT/frontend/lib/$f"
    fi
    echo "patched $f"
  fi
done

cat > "$ROOT/frontend/.env.production" <<EOF
NEXT_PUBLIC_SITE_URL=http://${PUBLIC_IP}
EOF

cd "$ROOT/frontend"
npm run build

sudo cp "$ROOT/deploy/nginx/lumina-insurance.conf" /etc/nginx/sites-available/lumina 2>/dev/null || \
sudo cp /tmp/lumina-fix-upload/lumina-insurance.conf /etc/nginx/sites-available/lumina
sudo ln -sf /etc/nginx/sites-available/lumina /etc/nginx/sites-enabled/lumina
sudo nginx -t
sudo chown -R www-data:www-data "$ROOT/frontend"
sudo systemctl restart lumina-frontend
sudo systemctl reload nginx

echo "=== Verify redirect ==="
curl -s -I "http://${PUBLIC_IP}/crm/dashboard" | grep -i location || true
echo "Done."
