#!/usr/bin/env bash
set -a
source /var/www/Bhealth-Insurance/backend/.env
set +a
CODE=$(curl -s -o /tmp/login.json -w '%{http_code}' -X POST http://127.0.0.1:8000/api/login/ \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"lumina-admin\",\"password\":\"${DJANGO_SUPERUSER_PASSWORD}\"}")
echo "login:$CODE"
if [[ "$CODE" == "200" ]]; then
  TOKEN=$(python3 -c "import json; print(json.load(open('/tmp/login.json'))['access'])")
  PCODE=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/api/polizas/ -H "Authorization: Bearer ${TOKEN}")
  echo "polizas:$PCODE"
  curl -s http://127.0.0.1:8000/api/polizas/ -H "Authorization: Bearer ${TOKEN}" | python3 -c "import sys,json; r=json.load(sys.stdin); print('poliza_count:', len(r) if isinstance(r,list) else r.get('count', len(r.get('results',[]))))"
fi
