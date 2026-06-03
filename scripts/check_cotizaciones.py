import urllib.request, urllib.parse, json
API='http://127.0.0.1:8000/api'
headers={'Content-Type':'application/json','Host':'127.0.0.1'}

def post(path,data, token=None):
    url=API+path
    req=urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
    if token: req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.getcode(), json.load(resp)
    except urllib.error.HTTPError as e:
        try:
            body=e.read().decode()
        except:
            body=str(e)
        print('HTTPError', e.code, body)
        return e.code, None

code, resp = post('/login/', {'username':'dashboard_admin_test','password':'Admin12345!'})
print('login', code)
if code!=200:
    raise SystemExit(1)
token=resp.get('access')
req=urllib.request.Request(API+'/polizas/cotizaciones/', headers={'Authorization':f'Bearer {token}','Host':'127.0.0.1'})
with urllib.request.urlopen(req) as r:
    print('status', r.status)
    data=json.load(r)
    results = data.get('results', data)
    print('count', len(results))
    print(results[:3])
