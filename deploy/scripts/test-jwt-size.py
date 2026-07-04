#!/usr/bin/env python3
import json, os, urllib.parse, urllib.request
from pathlib import Path

env = Path('/var/www/Bhealth-Insurance/backend/.env')
for line in env.read_text().splitlines():
    if '=' in line and not line.strip().startswith('#'):
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip())

data = json.dumps({
    'username': os.environ.get('DJANGO_SUPERUSER_USERNAME', 'lumina-admin'),
    'password': os.environ['DJANGO_SUPERUSER_PASSWORD'],
}).encode()
req = urllib.request.Request(
    'http://127.0.0.1:8000/api/login/',
    data=data,
    headers={'Content-Type': 'application/json'},
    method='POST',
)
body = json.load(urllib.request.urlopen(req))
token = body['access']
enc = urllib.parse.quote(token, safe='')
print('jwt_len', len(token))
print('cookie_encoded_len', len(enc))
print('role', body.get('role'))
