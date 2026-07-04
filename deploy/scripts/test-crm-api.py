#!/usr/bin/env python3
import json, os, urllib.request
from pathlib import Path

env = Path('/var/www/Bhealth-Insurance/backend/.env')
for line in env.read_text().splitlines():
    if '=' in line and not line.strip().startswith('#'):
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip())

base = 'http://127.0.0.1:8000/api'
user = os.environ['DJANGO_SUPERUSER_USERNAME']
pwd = os.environ['DJANGO_SUPERUSER_PASSWORD']

def req(method, path, token=None, data=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(f'{base}{path}', data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=15) as resp:
            return resp.status, json.load(resp) if resp.length else {}
    except urllib.error.HTTPError as e:
        return e.code, {}

code, body = req('POST', '/login/', data={'username': user, 'password': pwd})
print(f'login: {code}')
token = body.get('access', '')
for path, name in [('/profile/', 'profile'), ('/dashboard/stats/', 'dashboard'), ('/polizas/', 'polizas'), ('/polizas/cotizaciones/', 'cotizaciones')]:
    c, b = req('GET', path, token=token)
    extra = ''
    if name == 'polizas' and isinstance(b, dict):
        extra = f" count={b.get('count', len(b.get('results', [])))}"
    print(f'{name}: {c}{extra}')
