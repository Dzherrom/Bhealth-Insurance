#!/usr/bin/env python3
import json, os, urllib.request
from pathlib import Path

for line in Path('/var/www/Bhealth-Insurance/backend/.env').read_text().splitlines():
    if '=' in line and not line.strip().startswith('#'):
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip())

pwd = os.environ.get('DJANGO_SUPERUSER_PASSWORD', '')
user = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'lumina-admin')
data = json.dumps({'username': user, 'password': pwd}).encode()
req = urllib.request.Request('http://127.0.0.1:8000/api/login/', data=data,
    headers={'Content-Type': 'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        body = json.load(r)
        print('login:OK', r.status, 'role', body.get('role', 'n/a'))
except Exception as e:
    print('login:FAIL', getattr(e, 'code', e))
