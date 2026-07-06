#!/usr/bin/env bash
set -euo pipefail

BASE=/var/www/Bhealth-Insurance/frontend
SRC=/tmp/login-fix2

cp "$SRC/authSession.ts" "$BASE/lib/authSession.ts"
cp "$SRC/middlewareAccess.ts" "$BASE/lib/middlewareAccess.ts"
cp "$SRC/api.ts" "$BASE/lib/api.ts"
cp "$SRC/authStore.ts" "$BASE/store/authStore.ts"
cp "$SRC/page.tsx" "$BASE/app/auth/login/page.tsx"
cp "$SRC/middleware.ts" "$BASE/middleware.ts"
cp "$SRC/CatalogoProvider.tsx" "$BASE/components/providers/CatalogoProvider.tsx"

chown -R deploy:deploy "$BASE"
cd "$BASE"
export NEXT_PUBLIC_SITE_URL=http://2.25.68.83
npm run build

chown -R www-data:www-data "$BASE"
systemctl restart lumina-frontend
echo "DEPLOY_OK"
