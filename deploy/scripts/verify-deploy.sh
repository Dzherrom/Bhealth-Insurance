#!/usr/bin/env bash
# Lumina Insurance — post-deploy verification (step 11)
set -o pipefail

PUBLIC_IP="${PUBLIC_IP:-2.25.68.83}"
FAIL=0

ok()   { echo "  OK   $*"; }
fail() { echo "  FAIL $*"; FAIL=1; }

echo "=== Lumina deploy verification ==="
echo

echo "-- systemd services --"
for svc in lumina-backend lumina-frontend nginx postgresql; do
  if systemctl is-active --quiet "${svc}"; then
    ok "${svc} is active"
  else
    fail "${svc} is NOT active"
  fi
done
echo

echo "-- listening ports --"
if ss -tlnp 2>/dev/null | grep -q '127.0.0.1:8000'; then
  ok "gunicorn on 127.0.0.1:8000"
else
  fail "gunicorn not on 127.0.0.1:8000"
fi
if ss -tlnp 2>/dev/null | grep -q '127.0.0.1:3000'; then
  ok "next.js on 127.0.0.1:3000"
else
  fail "next.js not on 127.0.0.1:3000"
fi
if ss -tlnp 2>/dev/null | grep -q ':80 '; then
  ok "nginx on :80"
else
  fail "nginx not on :80"
fi
echo

echo "-- HTTP checks (localhost) --"
for url in \
  "http://127.0.0.1:8000/api/" \
  "http://127.0.0.1:8000/admin/" \
  "http://127.0.0.1:3000/" \
  "http://127.0.0.1/"
do
  code="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 "${url}" || echo '000')"
  if [[ "${code}" =~ ^[23] ]]; then
    ok "${url} → HTTP ${code}"
  else
    fail "${url} → HTTP ${code}"
  fi
done
echo

echo "-- HTTP checks (public ${PUBLIC_IP}) --"
for url in \
  "http://${PUBLIC_IP}/" \
  "http://${PUBLIC_IP}/api/" \
  "http://${PUBLIC_IP}/admin/" \
  "http://${PUBLIC_IP}/auth/login"
do
  code="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 "${url}" || echo '000')"
  if [[ "${code}" =~ ^[23] ]]; then
    ok "${url} → HTTP ${code}"
  else
    fail "${url} → HTTP ${code}"
  fi
done
echo

echo "-- ports that should NOT be public --"
for port in 3000 8000; do
  code="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 "http://${PUBLIC_IP}:${port}/" 2>/dev/null || echo '000')"
  if [[ "${code}" == "000" ]]; then
    ok "port ${port} not reachable from outside (good)"
  else
    fail "port ${port} is reachable from outside (HTTP ${code}) — close in UFW"
  fi
done
echo

if [[ "${FAIL}" -eq 0 ]]; then
  echo "=== ALL CHECKS PASSED ==="
  exit 0
fi
echo "=== SOME CHECKS FAILED — review output above ==="
exit 1
