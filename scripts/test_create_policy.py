import urllib.request, urllib.parse, json, sys, time
API='http://127.0.0.1:8000/api'
headers={'Content-Type':'application/json'}

def post(path, data, token=None):
    url=API+path
    req=urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
    if token: req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.getcode(), json.load(resp)
    except urllib.error.HTTPError as e:
        try:
            body=e.read().decode()
            print(f'HTTPError {e.code} {body}')
        except:
            print('HTTPError', e)
        return e.code, None

# 1 - login
login_data={'username':'dashboard_admin_test','password':'Admin12345!'}
code, resp = post('/login/', login_data)
print('login', code, resp)
if code!=200:
    sys.exit(1)
token=resp.get('access')

# 2 - create aseguradora
aseg={'nombre':'Test Aseg'}
code, aresp = post('/aseguradoras/', aseg, token)
print('aseg', code, aresp)
if code not in (200,201): sys.exit(1)
aseg_id=aresp['id']

# 3 - create plan
plan={'id_plan_aseguradora':'P-TEST','nombre':'Plan Test','aseguradora':aseg_id}
code, presp = post('/planes/', plan, token)
print('plan', code, presp)
if code not in (200,201): sys.exit(1)
plan_id=presp['id']

# 4 - create direccion
direccion={'linea1':'Calle Falsa 123','ciudad':'Ciudad','estado':'Estado','zip_code':'12345','condado':'Condado'}
code, dresp = post('/direcciones/', direccion, token)
print('direccion', code, dresp)
if code not in (200,201): sys.exit(1)
dir_id=dresp['id']

# 5 - create cliente
ssn_val = f"TMP{int(time.time())%1000000:06d}"
ssn_val = ssn_val[:20]
cliente={'primer_nombre':'Test','apellido_paterno':'User','genero':'Masculino','fecha_nacimiento':'1990-01-01','ssn':ssn_val,'email':f'test+auto+{ssn_val}@example.com','telefono':'0000000000','ingreso_anual':0,'estado_civil':'Desconocido','pais_nacimiento':'Desconocido','estado_inmigracion':'Desconocido'}
code, cresp = post('/clientes/', cliente, token)
print('cliente', code, cresp)
if code not in (200,201): sys.exit(1)
cliente_id=cresp['id']

# 6 - create poliza
poliza={'agente':None,'fecha_efectiva':'2026-07-01','id_mercado':f'QUOTE-{int(time.time())}','id_miembro':'Pend','plan':plan_id,'costo_poliza':0,'subsidio':0,'prima_mensual':0,'fecha_envio':'2026-06-03','direccion_fisica':dir_id,'clientes_data':[{'cliente':cliente_id,'es_solicitante_principal':True,'relacion':'PRINCIPAL','direccion_residencia':dir_id}]}
code, presp = post('/polizas/', poliza, token)
print('poliza', code, presp)
if code not in (200,201): sys.exit(1)
print('All done.')
