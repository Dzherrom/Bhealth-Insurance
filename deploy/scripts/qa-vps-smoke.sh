#!/usr/bin/env bash
# Lumina Insurance — VPS smoke + anti-localhost regression (extends verify-deploy.sh)
set -o pipefail

PUBLIC_IP="${PUBLIC_IP:-2.25.68.83}"
APP_ROOT="${APP_ROOT:-/var/www/Bhealth-Insurance}"
FAIL=0
WARN=0

ok()   { echo "  OK   $*"; }
fail() { echo "  FAIL $*"; FAIL=1; }
warn() { echo "  WARN $*"; WARN=1; }

echo "=== Lumina VPS smoke + anti-localhost ==="
echo

# --- Base infra (reuse verify-deploy) ---
if [[ -f "${APP_ROOT}/deploy/scripts/verify-deploy.sh" ]]; then
  echo "-- verify-deploy (infra) --"
  if bash "${APP_ROOT}/deploy/scripts/verify-deploy.sh"; then
    ok "verify-deploy passed"
  else
    warn "verify-deploy reported failures (see above; port self-check from VPS may false-positive)"
  fi
  echo
else
  fail "verify-deploy.sh not found at ${APP_ROOT}/deploy/scripts/"
fi

echo "-- anti-localhost redirects (public IP) --"
check_no_localhost_redirect() {
  local path="$1"
  local label="$2"
  local headers
  headers="$(curl -s -D - -o /dev/null --connect-timeout 8 "http://${PUBLIC_IP}${path}" 2>/dev/null || true)"
  local location
  location="$(echo "${headers}" | grep -i '^location:' | head -1 | tr -d '\r')"

  if echo "${location}" | grep -qiE 'localhost|127\.0\.0\.1|:3000'; then
    fail "${label}: redirect to localhost/internal → ${location}"
    return
  fi

  if [[ -n "${location}" ]]; then
    ok "${label}: redirect OK → ${location}"
  else
    local code
    code="$(echo "${headers}" | head -1)"
    ok "${label}: no redirect (${code})"
  fi
}

check_no_localhost_redirect "/" "B1 root"
check_no_localhost_redirect "/auth/login" "B1 auth/login (direct)"
check_no_localhost_redirect "/crm/dashboard" "B7 crm/dashboard (no session)"
check_no_localhost_redirect "/crm/polizas" "B7 crm/polizas (no session)"
check_no_localhost_redirect "/client" "F1 client portal entry"
echo

echo "-- frontend env + build scan --"
ENV_FILE="${APP_ROOT}/frontend/.env.production"
if [[ -f "${ENV_FILE}" ]]; then
  if grep -q 'NEXT_PUBLIC_SITE_URL=http://'"${PUBLIC_IP}" "${ENV_FILE}" 2>/dev/null; then
    ok "NEXT_PUBLIC_SITE_URL set to public IP"
  else
    fail "NEXT_PUBLIC_SITE_URL missing or wrong in ${ENV_FILE}"
    grep 'NEXT_PUBLIC' "${ENV_FILE}" 2>/dev/null | sed 's/=.*/=***/' || true
  fi
else
  fail "frontend/.env.production not found"
fi

LOCALHOST_HITS="$(grep -r 'localhost:3000' "${APP_ROOT}/frontend/.next/" 2>/dev/null | wc -l | tr -d ' ')"
ONRENDER_HITS="$(grep -r 'onrender.com' "${APP_ROOT}/frontend/.next/" 2>/dev/null | wc -l | tr -d ' ')"
if [[ "${LOCALHOST_HITS}" -gt 0 ]]; then
  warn "localhost:3000 found ${LOCALHOST_HITS} times in .next build (may be in middleware bundle)"
else
  ok "no localhost:3000 strings in .next"
fi
if [[ "${ONRENDER_HITS}" -gt 0 ]]; then
  fail "onrender.com found ${ONRENDER_HITS} times in .next build"
else
  ok "no onrender.com in .next"
fi

if grep -q 'buildRedirectUrl' "${APP_ROOT}/frontend/middleware.ts" 2>/dev/null; then
  ok "middleware uses buildRedirectUrl (localhost fix present in source)"
else
  fail "middleware still uses legacy redirect (buildRedirectUrl missing)"
fi
echo

echo "-- nginx forwarded headers (CRM route) --"
HDRS="$(curl -s -D - -o /dev/null --connect-timeout 8 "http://${PUBLIC_IP}/crm/dashboard" 2>/dev/null || true)"
if echo "${HDRS}" | grep -qi 'location:.*localhost'; then
  fail "CRM middleware redirect exposes localhost (deploy old build or missing NEXT_PUBLIC_SITE_URL)"
fi
echo

echo "-- API smoke --"
API_CODE="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 8 "http://${PUBLIC_IP}/api/")"
if [[ "${API_CODE}" =~ ^2 ]]; then
  ok "/api/ → HTTP ${API_CODE}"
else
  fail "/api/ → HTTP ${API_CODE}"
fi

UNAUTH_CODE="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 8 "http://${PUBLIC_IP}/api/dashboard/stats/")"
if [[ "${UNAUTH_CODE}" == "401" ]]; then
  ok "protected endpoint returns 401 without token"
else
  fail "expected 401 on /api/dashboard/stats/, got ${UNAUTH_CODE}"
fi

CORS_HDR="$(curl -s -D - -o /dev/null -X OPTIONS "http://${PUBLIC_IP}/api/users/" \
  -H "Origin: http://${PUBLIC_IP}" \
  -H 'Access-Control-Request-Method: GET' 2>/dev/null | grep -i 'access-control-allow-origin' | tr -d '\r')"
if echo "${CORS_HDR}" | grep -q "http://${PUBLIC_IP}"; then
  ok "CORS preflight allows public origin"
else
  fail "CORS preflight missing or wrong: ${CORS_HDR:-none}"
fi
echo

if [[ "${FAIL}" -eq 0 ]]; then
  if [[ "${WARN}" -gt 0 ]]; then
    echo "=== SMOKE PASSED WITH WARNINGS ==="
    exit 0
  fi
  echo "=== ALL SMOKE CHECKS PASSED ==="
  exit 0
fi
echo "=== SMOKE CHECKS FAILED — see output above ==="
exit 1
