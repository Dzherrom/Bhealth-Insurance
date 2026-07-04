#!/usr/bin/env python3
import json, os, urllib.request
from pathlib import Path

env = Path('/var/www/Bhealth-Insurance/backend/.env')
for line in env.read_text().splitlines():
    if '=' in line and not line.strip().startswith('#'):
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip())

def login(username):
    data = json.dumps({'username': username, 'password': os.environ['DJANGO_SUPERUSER_PASSWORD']}).encode()
    req = urllib.request.Request('http://127.0.0.1:8000/api/login/', data=data,
        headers={'Content-Type': 'application/json'}, method='POST')
    return json.load(urllib.request.urlopen(req))

for user in ['lumina-admin', 'bhealth-admin']:
    try:
        body = login(user)
        token = body['access']
        req = urllib.request.Request('http://127.0.0.1:8000/api/profile/',
            headers={'Authorization': f'Bearer {token}'})
        prof = json.load(urllib.request.urlopen(req))
        p = prof.get('profile') or {}
        print(user, 'login_role=', body.get('role'), 'profile.role=', p.get('role'), 'cliente=', p.get('cliente'))
    except Exception as e:
        print(user, 'FAIL', getattr(e, 'code', e))
