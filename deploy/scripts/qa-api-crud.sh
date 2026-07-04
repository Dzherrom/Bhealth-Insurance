#!/usr/bin/env bash
# Lumina Insurance — API CRUD smoke (super_admin token required)
# Usage on VPS:
#   export QA_API_BASE="http://127.0.0.1:8000/api"
#   export QA_USERNAME="lumina-admin"
#   export QA_PASSWORD="***"
#   bash deploy/scripts/qa-api-crud.sh
set -o pipefail

API_BASE="${QA_API_BASE:-http://127.0.0.1:8000/api}"
API_BASE="${API_BASE%/}"
USERNAME="${QA_USERNAME:-lumina-admin}"
PASSWORD="${QA_PASSWORD:-}"
PREFIX="QA-TEST-$(date +%Y%m%d%H%M%S)"

PASS=0
FAIL=0
SKIP=0

pass() { echo "  PASS $*"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL $*"; FAIL=$((FAIL + 1)); }
skip() { echo "  SKIP $*"; SKIP=$((SKIP + 1)); }

json_field() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d$1)" 2>/dev/null
}

request() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local expect="${4:-2xx}"
  local url="${API_BASE}${path}"
  local tmp
  tmp="$(mktemp)"
  local code

  if [[ -n "${data}" ]]; then
    code="$(curl -s -o "${tmp}" -w '%{http_code}' -X "${method}" "${url}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H 'Content-Type: application/json' \
      -d "${data}")"
  else
    code="$(curl -s -o "${tmp}" -w '%{http_code}' -X "${method}" "${url}" \
      -H "Authorization: Bearer ${TOKEN}")"
  fi

  local ok=0
  case "${expect}" in
    2xx) [[ "${code}" =~ ^2 ]] && ok=1 ;;
    401) [[ "${code}" == "401" ]] && ok=1 ;;
    403) [[ "${code}" == "403" ]] && ok=1 ;;
    404) [[ "${code}" == "404" ]] && ok=1 ;;
    405) [[ "${code}" == "405" ]] && ok=1 ;;
    *)   [[ "${code}" == "${expect}" ]] && ok=1 ;;
  esac

  if [[ "${ok}" -eq 1 ]]; then
    pass "${method} ${path} → ${code}"
  else
    local body
    body="$(head -c 300 "${tmp}" | tr '\n' ' ')"
    fail "${method} ${path} → ${code} (expected ${expect}) ${body}"
  fi
  RESPONSE_FILE="${tmp}"
  HTTP_CODE="${code}"
}

echo "=== Lumina API CRUD QA ==="
echo "API_BASE=${API_BASE}"
echo "PREFIX=${PREFIX}"
echo

if [[ -z "${PASSWORD}" ]]; then
  ENV_FILE="${QA_ENV_FILE:-/var/www/Bhealth-Insurance/backend/.env}"
  if [[ -f "${ENV_FILE}" ]]; then
    # shellcheck disable=SC1090
    set -a
    source "${ENV_FILE}" 2>/dev/null || true
    set +a
    PASSWORD="${DJANGO_SUPERUSER_PASSWORD:-}"
    USERNAME="${DJANGO_SUPERUSER_USERNAME:-${USERNAME}}"
  fi
fi

if [[ -z "${PASSWORD}" ]]; then
  echo "ERROR: set QA_PASSWORD or DJANGO_SUPERUSER_PASSWORD in backend/.env"
  exit 2
fi

echo "-- C.1 Authentication --"
LOGIN_TMP="$(mktemp)"
LOGIN_CODE="$(curl -s -o "${LOGIN_TMP}" -w '%{http_code}' -X POST "${API_BASE}/login/" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}")"

if [[ "${LOGIN_CODE}" == "200" ]]; then
  pass "POST /login/ valid credentials → 200"
  TOKEN="$(python3 -c "import json; print(json.load(open('${LOGIN_TMP}'))['access'])" 2>/dev/null || true)"
  REFRESH="$(python3 -c "import json; print(json.load(open('${LOGIN_TMP}'))['refresh'])" 2>/dev/null || true)"
else
  fail "POST /login/ valid credentials → ${LOGIN_CODE}"
  cat "${LOGIN_TMP}" | head -c 200
  echo
  exit 1
fi

BAD_CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST "${API_BASE}/login/" \
  -H 'Content-Type: application/json' \
  -d '{"username":"invalid-qa","password":"invalid-qa"}')"
if [[ "${BAD_CODE}" == "401" ]]; then
  pass "POST /login/ invalid credentials → 401"
else
  fail "POST /login/ invalid credentials → ${BAD_CODE} (expected 401)"
fi

if [[ -n "${REFRESH}" ]]; then
  REFRESH_TMP="$(mktemp)"
  REFRESH_CODE="$(curl -s -o "${REFRESH_TMP}" -w '%{http_code}' -X POST "${API_BASE}/login/refresh/" \
    -H 'Content-Type: application/json' \
    -d "{\"refresh\":\"${REFRESH}\"}")"
  if [[ "${REFRESH_CODE}" == "200" ]]; then
    pass "POST /login/refresh/ valid refresh → 200"
    TOKEN="$(python3 -c "import json; print(json.load(open('${REFRESH_TMP}'))['access'])" 2>/dev/null || echo "${TOKEN}")"
  else
    fail "POST /login/refresh/ → ${REFRESH_CODE}"
  fi
fi

request GET "/profile/" "" 2xx
PROFILE_ROLE="$(python3 -c "import json; d=json.load(open('${RESPONSE_FILE}')); print((d.get('profile') or {}).get('role',''))" 2>/dev/null || true)"
echo "  INFO profile.role=${PROFILE_ROLE:-unknown}"

LOGOUT_CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST "${API_BASE}/logout/" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"refresh\":\"${REFRESH}\"}")"
if [[ "${LOGOUT_CODE}" =~ ^2 ]]; then
  pass "POST /logout/ → ${LOGOUT_CODE}"
else
  warn_logout="${LOGOUT_CODE}"
fi

# Re-login for CRUD tests (logout may blacklist refresh)
LOGIN_CODE="$(curl -s -o "${LOGIN_TMP}" -w '%{http_code}' -X POST "${API_BASE}/login/" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}")"
TOKEN="$(python3 -c "import json; print(json.load(open('${LOGIN_TMP}'))['access'])" 2>/dev/null)"
REFRESH="$(python3 -c "import json; print(json.load(open('${LOGIN_TMP}'))['refresh'])" 2>/dev/null)"
echo

echo "-- D ViewSet LIST (super_admin) --"
ENDPOINTS=(
  users agencias direcciones agentes clientes aseguradoras tipos-producto planes
  estados-poliza polizas notas historial etiquetas carpetas-documentos documentos
  tareas cambios-de-vida ingresos-empleador documentos-legales recordatorios citas
  medicos medicos-poliza medicamentos contratos reportes_comision configuracion-comisiones
  notificaciones tarjetas_credito cuentas_bancarias info_pago departamentos
  matriz-permisos auditoria-global transferencias-poliza consent-requests
)
for ep in "${ENDPOINTS[@]}"; do
  request GET "/${ep}/" "" 2xx
done
echo

echo "-- D Special endpoints --"
request GET "/dashboard/stats/" "" 2xx
request GET "/polizas/cotizaciones/" "" 2xx
request GET "/utils/zipcode/33101/" "" 2xx
MONTH="$(date +%m | sed 's/^0//')"
YEAR="$(date +%Y)"
request GET "/reportes/agentes-facturacion/?month=${MONTH}&year=${YEAR}" "" 2xx
request GET "/departamentos/" "" 2xx
request GET "/matriz-permisos/" "" 2xx
request GET "/auditoria-global/" "" 2xx
echo

echo "-- D CREATE/PATCH/DELETE smoke (QA prefix) --"
# Agencia
request POST "/agencias/" "{\"nombre\":\"${PREFIX}-Agencia\"}" 2xx
AGENCIA_ID="$(python3 -c "import json; print(json.load(open('${RESPONSE_FILE}'))['id'])" 2>/dev/null || true)"
if [[ -n "${AGENCIA_ID}" ]]; then
  request GET "/agencias/${AGENCIA_ID}/" "" 2xx
  request PATCH "/agencias/${AGENCIA_ID}/" "{\"telefono\":\"+15550001111\"}" 2xx
  request DELETE "/agencias/${AGENCIA_ID}/" "" 2xx
fi

# Etiqueta
request POST "/etiquetas/" "{\"nombre\":\"${PREFIX}-Tag\",\"color\":\"#ff0000\"}" 2xx
TAG_ID="$(python3 -c "import json; print(json.load(open('${RESPONSE_FILE}'))['id'])" 2>/dev/null || true)"
if [[ -n "${TAG_ID}" ]]; then
  request DELETE "/etiquetas/${TAG_ID}/" "" 2xx
fi

# Direccion
request POST "/direcciones/" "{\"linea1\":\"${PREFIX} St\",\"ciudad\":\"Miami\",\"estado\":\"FL\",\"zip_code\":\"33101\",\"condado\":\"Miami-Dade\",\"pais\":\"US\"}" 2xx
DIR_ID="$(python3 -c "import json; print(json.load(open('${RESPONSE_FILE}'))['id'])" 2>/dev/null || true)"
if [[ -n "${DIR_ID}" ]]; then
  request DELETE "/direcciones/${DIR_ID}/" "" 2xx
fi

# Poliza delete behavior (may be 405 archive-only)
FIRST_POLIZA="$(curl -s "${API_BASE}/polizas/?page_size=1" -H "Authorization: Bearer ${TOKEN}" | python3 -c "import sys,json; r=json.load(sys.stdin); print((r if isinstance(r,list) else r.get('results',[]))[0]['id'])" 2>/dev/null || true)"
if [[ -n "${FIRST_POLIZA}" ]]; then
  request DELETE "/polizas/${FIRST_POLIZA}/" "" 405
  skip "poliza DELETE → 405 documented (archive instead of hard delete)"
else
  skip "no polizas in DB for DELETE behavior test"
fi
echo

echo "-- F Portal cliente (if demo user exists) --"
CLIENT_USER="${QA_CLIENT_USERNAME:-}"
CLIENT_PASS="${QA_CLIENT_PASSWORD:-Caracas2026.*}"
if [[ -z "${CLIENT_USER}" ]]; then
  CLIENT_USER="$(curl -s "${API_BASE}/clientes/?search=BHDEMO&page_size=1" -H "Authorization: Bearer ${TOKEN}" \
    | python3 -c "import sys,json; r=json.load(sys.stdin); items=r if isinstance(r,list) else r.get('results',[]); print(items[0].get('email','') if items else '')" 2>/dev/null || true)"
fi
if [[ -n "${CLIENT_USER}" ]]; then
  CLIENT_LOGIN="$(mktemp)"
  # Try email-based portal user from demo data
  for try_user in "${CLIENT_USER}" "cliente.bhdemo.princ.00001"; do
    CCODE="$(curl -s -o "${CLIENT_LOGIN}" -w '%{http_code}' -X POST "${API_BASE}/login/" \
      -H 'Content-Type: application/json' \
      -d "{\"username\":\"${try_user}\",\"password\":\"${CLIENT_PASS}\"}")"
    if [[ "${CCODE}" == "200" ]]; then
      CTOKEN="$(python3 -c "import json; print(json.load(open('${CLIENT_LOGIN}'))['access'])" 2>/dev/null)"
      pass "POST /login/ portal client (${try_user}) → 200"
      PDASH="$(curl -s -o /dev/null -w '%{http_code}' "${API_BASE}/portal-cliente/dashboard/" -H "Authorization: Bearer ${CTOKEN}")"
      if [[ "${PDASH}" == "200" ]]; then
        pass "GET /portal-cliente/dashboard/ → 200"
      else
        fail "GET /portal-cliente/dashboard/ → ${PDASH}"
      fi
      break
    fi
  done
else
  skip "portal cliente login (no demo client user found; run populate_full_demo_data)"
fi
echo

if [[ -n "${REFRESH}" ]]; then
  LOGOUT_CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST "${API_BASE}/logout/" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H 'Content-Type: application/json' \
    -d "{\"refresh\":\"${REFRESH}\"}")"
  if [[ "${LOGOUT_CODE}" =~ ^2 ]]; then
    pass "POST /logout/ (end) → ${LOGOUT_CODE}"
  elif [[ -n "${warn_logout:-}" ]]; then
    fail "POST /logout/ → ${LOGOUT_CODE} (early attempt: ${warn_logout})"
  else
    fail "POST /logout/ → ${LOGOUT_CODE}"
  fi
fi
echo

echo "=== SUMMARY: ${PASS} passed, ${FAIL} failed, ${SKIP} skipped ==="
if [[ "${FAIL}" -gt 0 ]]; then
  exit 1
fi
exit 0
