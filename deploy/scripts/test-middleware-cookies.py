#!/usr/bin/env python3
"""Simulate browser cookies against Next.js middleware via public URL."""
import json, os, urllib.parse, urllib.request
from pathlib import Path

PUBLIC = 'http://2.25.68.83'
env = Path('/var/www/Bhealth-Insurance/backend/.env')
for line in env.read_text().splitlines():
    if '=' in line and not line.strip().startswith('#'):
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip())

data = json.dumps({
    'username': os.environ.get('DJANGO_SUPERUSER_USERNAME', 'lumina-admin'),
    'password': os.environ['DJANGO_SUPERUSER_PASSWORD'],
}).encode()
req = urllib.request.Request(f'http://127.0.0.1:8000/api/login/', data=data,
    headers={'Content-Type': 'application/json'}, method='POST')
body = json.load(urllib.request.urlopen(req))
token = body['access']
role = body.get('role', 'super_admin')
enc_token = urllib.parse.quote(token, safe='')

def head(path, cookie=''):
    r = urllib.request.Request(f'{PUBLIC}{path}', method='HEAD', headers={'Cookie': cookie} if cookie else {})
    try:
        resp = urllib.request.urlopen(r)
        loc = resp.headers.get('Location', '')
        print(f'{path} -> {resp.status} location={loc}')
    except urllib.error.HTTPError as e:
        loc = e.headers.get('Location', '')
        print(f'{path} -> {e.code} location={loc}')

print('--- no cookies ---')
head('/crm/dashboard')
head('/auth/login')

cookie = f'access_token={enc_token}; user_role={role}; auth_session=1'
print('--- with session cookies ---')
head('/crm/dashboard', cookie)
head('/auth/login', cookie)
