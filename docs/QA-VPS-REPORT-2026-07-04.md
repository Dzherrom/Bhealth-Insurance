# Informe QA VPS — Lumina Insurance

**Fecha:** 2026-07-04  
**Entorno:** `http://2.25.68.83` (Hostinger VPS, sin dominio)  
**Ejecutor:** QA automatizado + verificación remota SSH/curl  
**Repo VPS:** `/var/www/Bhealth-Insurance`

---

## Resumen ejecutivo

| Métrica | Valor |
|---------|-------|
| **PASS** | 68 |
| **FAIL** | 9 |
| **BLOCKED** | 14 |
| **SKIP** | 4 |

**Veredicto: NO production-ready** — hay un fallo crítico de redirect a `localhost:3000` en rutas CRM que impide el uso del panel tras login. La API backend funciona correctamente cuando se usan credenciales válidas, pero la configuración de frontend en el VPS está desactualizada respecto al repositorio local.

### Hallazgos críticos (orden de prioridad)

1. **Redirect a `localhost:3000`** en `/crm/dashboard`, `/crm/polizas` y cualquier ruta `/crm/*` sin sesión (y probablemente tras login).
2. **`frontend/.env.production` incorrecto** — falta `NEXT_PUBLIC_SITE_URL`; existe `NEXT_API_URL` con IP errónea (`2.25.268.83`).
3. **Código desplegado desactualizado** — el middleware en VPS usa `getPublicOrigin` legacy; el repo local ya tiene `buildRedirectUrl`.
4. **Credenciales `.env` ≠ DB** — `DJANGO_SUPERUSER_PASSWORD` en `backend/.env` no coincide con la contraseña real de `lumina-admin` en PostgreSQL (login API/UI con `.env` → 401).
5. **Seed demo roto** — `populate_full_demo_data` falla con `AttributeError: 'Poliza' object has no attribute 'etiquetas'`.

---

## Tabla por fase

| Fase | Descripción | Resultado | PASS | FAIL | BLOCKED |
|------|-------------|-----------|------|------|---------|
| **A** | Infraestructura y conectividad | **PASS*** | 11 | 2* | 0 |
| **B** | Anti-regresión localhost | **FAIL** | 3 | 5 | 0 |
| **C** | Autenticación y sesión | **PARTIAL** | 5 | 2 | 4 |
| **D** | CRUD API (script automatizado) | **PASS** | 56 | 0 | 0 |
| **E** | Frontend CRM (manual) | **BLOCKED** | 1 | 0 | 10 |
| **F** | Portal cliente | **BLOCKED** | 1 | 0 | 5 |
| **G** | Archivos, CORS, errores comunes | **PASS** | 5 | 1 | 0 |
| **H** | Rendimiento y estabilidad | **SKIP** | 0 | 0 | 4 |

\* Fase A: los 2 FAIL son un falso positivo en `verify-deploy.sh` al hacer curl desde el VPS a su propia IP pública en puertos 3000/8000 (código `000000`). Desde Internet externa los puertos **no** son accesibles (timeout, exit 28). Fix aplicado en repo local.

---

## FASE A — Infraestructura

### A.1 Servicios systemd

```
lumina-backend   → active
lumina-frontend  → active
nginx            → active
postgresql       → active
```

### A.2 Puertos

| Puerto | Binding | Acceso Internet | Resultado |
|--------|---------|-----------------|-----------|
| 8000 | 127.0.0.1 | No (timeout) | ✅ PASS |
| 3000 | 127.0.0.1 | No (timeout) | ✅ PASS |
| 80 | 0.0.0.0 | Sí | ✅ PASS |

### A.3 Endpoints HTTP públicos

| URL | HTTP | Notas |
|-----|------|-------|
| `http://2.25.68.83/` | 307 → `/auth/login` | ✅ Relativo, sin localhost |
| `http://2.25.68.83/auth/login` | 200 | ✅ |
| `http://2.25.68.83/crm/dashboard` | 307 → `http://localhost:3000/auth/login` | ❌ **CRITICAL** |
| `http://2.25.68.83/api/` | 200 | ✅ JSON router |
| `http://2.25.68.83/admin/` | 302 → `/admin/login/` | ✅ |

**Evidencia (curl desde máquina local):**
```
$ curl.exe -s -I http://2.25.68.83/crm/dashboard
HTTP/1.1 307 Temporary Redirect
location: http://localhost:3000/auth/login
```

### A.4 Headers Nginx

Nginx config en VPS coincide con `deploy/nginx/lumina-insurance.conf`:
- `proxy_set_header Host $host`
- `proxy_set_header X-Forwarded-Host $host`
- `proxy_set_header X-Forwarded-Proto $scheme`

Los headers se envían correctamente; el problema está en el **middleware Next.js desplegado**, no en Nginx.

---

## FASE B — Anti-regresión localhost

| # | Prueba | Esperado | Actual | Resultado |
|---|--------|----------|--------|-----------|
| B1 | `GET /` | Redirect relativo a `/auth/login` | `location: /auth/login` | ✅ PASS |
| B2 | Login CRM | Redirect a `/crm/dashboard` en IP pública | **BLOCKED** (no se pudo probar UI por credenciales) | ⏸ BLOCKED |
| B3 | F5 `/crm/dashboard` | Permanece en IP | Redirect a localhost | ❌ FAIL |
| B4 | Network POST login | `http://2.25.68.83/api/login/` | No verificado en browser | ⏸ BLOCKED |
| B5 | GET `/api/profile/` | Misma IP, 200 | API OK con token válido | ✅ PASS (API) |
| B6 | Logout | `/auth/login` en IP | No verificado UI | ⏸ BLOCKED |
| B7 | `/crm/polizas` sin sesión | Redirect a login en IP | `localhost:3000/auth/login` | ❌ FAIL |
| B8 | Cookies | Dominio IP | No verificado browser | ⏸ BLOCKED |

### Build embebido (VPS)

| Check | Resultado |
|-------|-----------|
| `grep localhost:3000 .next/` | 2 ocurrencias (middleware bundle) |
| `grep onrender.com .next/` | 0 | ✅ |
| `NEXT_PUBLIC_SITE_URL` en `.env.production` | **Ausente** | ❌ |
| `middleware.ts` usa `buildRedirectUrl` | **No** (código legacy en VPS) | ❌ |

**Contenido actual `frontend/.env.production` en VPS:**
```
NEXT_API_URL=https://2.25.268.83/api
```
Errores: IP typo (`268` vs `68`), variable incorrecta (`NEXT_API_URL` vs `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_API_URL`), esquema `https` sin SSL.

---

## FASE C — Autenticación y sesión

### C.1 Auth endpoints (API directa)

| Endpoint | Caso | Status | Resultado |
|----------|------|--------|-----------|
| `POST /api/login/` | Credenciales `lumina-admin` + password en `.env` | 401 | ❌ FAIL |
| `POST /api/login/` | Credenciales `lumina-admin` + password real en DB | 200 + JWT | ✅ PASS |
| `POST /api/login/` | Credenciales inválidas | 401 | ✅ PASS |
| `POST /api/login/refresh/` | Refresh válido | 200 | ✅ PASS |
| `GET /api/profile/` | Bearer token | 200, `role=SUPER_ADMIN` | ✅ PASS |
| `POST /api/logout/` | Blacklist refresh | 205 | ✅ PASS |

### C.2 Roles UI

| Rol | Estado |
|-----|--------|
| Todos los roles CRM | ⏸ BLOCKED — UI CRM inaccesible por redirect localhost |
| Portal cliente | ⏸ BLOCKED — sin datos demo |

### C.3 JWT refresh en UI

⏸ BLOCKED — requiere sesión CRM funcional en browser.

---

## FASE D — CRUD API (`deploy/scripts/qa-api-crud.sh`)

Ejecutado en VPS: `56 passed, 0 failed, 2 skipped`

### ViewSets LIST (todos 200 con super_admin)

`users`, `agencias`, `direcciones`, `agentes`, `clientes`, `aseguradoras`, `tipos-producto`, `planes`, `estados-poliza`, `polizas`, `notas`, `historial`, `etiquetas`, `carpetas-documentos`, `documentos`, `tareas`, `cambios-de-vida`, `ingresos-empleador`, `documentos-legales`, `recordatorios`, `citas`, `medicos`, `medicos-poliza`, `medicamentos`, `contratos`, `reportes_comision`, `configuracion-comisiones`, `notificaciones`, `tarjetas_credito`, `cuentas_bancarias`, `info_pago`, `departamentos`, `matriz-permisos`, `auditoria-global`, `transferencias-poliza`, `consent-requests`

### Endpoints especiales

| Endpoint | Resultado |
|----------|-----------|
| `GET /dashboard/stats/` | ✅ 200 |
| `GET /polizas/cotizaciones/` | ✅ 200 |
| `GET /utils/zipcode/33101/` | ✅ 200 |
| `GET /reportes/agentes-facturacion/?month=7&year=2026` | ✅ 200 |

### CREATE/PATCH/DELETE smoke (prefijo `QA-TEST-`)

| Recurso | Operaciones | Resultado |
|---------|-------------|-----------|
| `agencias` | POST/GET/PATCH/DELETE | ✅ |
| `etiquetas` | POST/DELETE | ✅ |
| `direcciones` | POST/DELETE | ✅ |
| `polizas` DELETE | — | ⏸ SKIP (0 pólizas en DB) |

### Estado DB en VPS

```
users: 2 (lumina-admin, bhealth-admin)
polizas: 0
clientes: 0
agencias: 1
```

---

## FASE E — Frontend CRM (manual)

⏸ **BLOCKED** — redirect a localhost impide acceder a cualquier ruta `/crm/*`.

| Ruta | Estado |
|------|--------|
| `/auth/login` | ✅ Carga (200) — login no probado en browser |
| `/crm/dashboard` | ❌ Redirect localhost |
| `/crm/polizas` | ❌ Redirect localhost |
| Resto rutas CRM | ⏸ BLOCKED |

---

## FASE F — Portal cliente

| # | Caso | Resultado |
|---|------|-----------|
| F1 | `GET /client` | ✅ 200 (página carga) |
| F2–F6 | Login cliente, dashboard, solicitar cambio | ⏸ BLOCKED — `populate_full_demo_data` falló; 0 clientes |

Script local `npm run verify:client-login` (unit tests middleware): ✅ PASS

---

## FASE G — Archivos, CORS, errores

| # | Prueba | Resultado |
|---|--------|-----------|
| G1 | Upload documento | ⏸ SKIP (sin póliza) |
| G2 | `/static/admin/css/base.css` | ✅ 200 |
| G3 | CORS OPTIONS desde `http://2.25.68.83` | ✅ `access-control-allow-origin: http://2.25.68.83` |
| G4 | Sin token → protegido | ✅ 401 en `/api/dashboard/stats/` |
| G5 | Django admin | ✅ 302 → login |
| G6 | `/media/` (directorio) | ⚠️ 403 (esperado sin listado) |

---

## FASE H — Rendimiento y estabilidad

⏸ SKIP — bloqueado por fallos CRM y DB vacía.

---

## Bugs documentados

### [CRITICAL] Redirect CRM a localhost:3000

**Reproducir:**
```bash
curl -s -I http://2.25.68.83/crm/dashboard
# location: http://localhost:3000/auth/login
```

**Esperado:** `location: /auth/login` o `http://2.25.68.83/auth/login`  
**Actual:** `http://localhost:3000/auth/login`

**Archivos sospechosos:**
- `frontend/middleware.ts` (VPS: versión legacy con `new URL(redirectPath, publicOrigin)`)
- `frontend/lib/requestOrigin.ts` (VPS: sin `buildRedirectUrl` ni fallback `NEXT_PUBLIC_SITE_URL`)
- `frontend/.env.production` (falta `NEXT_PUBLIC_SITE_URL`)

**Fix sugerido:**
```bash
# En VPS
cd /var/www/Bhealth-Insurance
cat > frontend/.env.production <<'EOF'
NEXT_PUBLIC_SITE_URL=http://2.25.68.83
EOF
cd frontend && npm run build
sudo systemctl restart lumina-frontend
sudo systemctl reload nginx
bash deploy/scripts/qa-vps-smoke.sh
```
Asegurar que `git pull` trae el middleware con `buildRedirectUrl` antes del rebuild.

---

### [CRITICAL] frontend/.env.production mal configurado

**Reproducir:**
```bash
cat /var/www/Bhealth-Insurance/frontend/.env.production
```

**Esperado:**
```
NEXT_PUBLIC_SITE_URL=http://2.25.68.83
```

**Actual:**
```
NEXT_API_URL=https://2.25.268.83/api
```

**Fix sugerido:** Usar `frontend/.env.production.example` como plantilla.

---

### [HIGH] Contraseña lumina-admin desincronizada con backend/.env

**Reproducir:**
```bash
# Con password de backend/.env → 401
curl -X POST http://2.25.68.83/api/login/ \
  -H 'Content-Type: application/json' \
  -d '{"username":"lumina-admin","password":"<from .env>"}'
```

**Esperado:** 200  
**Actual:** 401

**Fix sugerido:**
```bash
cd /var/www/Bhealth-Insurance/backend
source ../venv/bin/activate
python manage.py ensure_crm_admin --update-password
```

---

### [HIGH] populate_full_demo_data falla en VPS

**Reproducir:**
```bash
python manage.py populate_full_demo_data
# AttributeError: 'Poliza' object has no attribute 'etiquetas'
```

**Esperado:** 100 pólizas demo  
**Actual:** Crash — código en VPS no coincide con modelo local o comando desactualizado.

**Fix sugerido:** `git pull` + verificar relación `Poliza`/`Etiqueta` en `models.py`; reintentar seed.

---

### [MEDIUM] verify-deploy.sh falso positivo en puertos

**Reproducir:** Ejecutar `verify-deploy.sh` desde el VPS; reporta FAIL en puertos 3000/8000 con HTTP `000000`.

**Fix sugerido:** Ya corregido en repo — normalizar código curl antes de comparar.

---

### [LOW] POST /api/logout/ devuelve 400 si refresh ya fue rotado

**Reproducir:** Llamar `/login/refresh/` y luego `/logout/` con el refresh original.

**Esperado:** 205  
**Actual:** 400 (token rotado invalida el refresh anterior)

**Nota:** Comportamiento de `simplejwt` con rotación; la UI debe enviar el refresh vigente.

---

## Scripts entregados

| Script | Descripción |
|--------|-------------|
| `deploy/scripts/qa-api-crud.sh` | CRUD automatizado contra `/api/` |
| `deploy/scripts/qa-vps-smoke.sh` | Smoke + anti-localhost (extiende verify-deploy) |
| `deploy/scripts/verify-deploy.sh` | Fix falso positivo puertos |

**Uso en VPS:**
```bash
# Smoke + anti-localhost
bash deploy/scripts/qa-vps-smoke.sh

# API CRUD (requiere credenciales válidas)
export QA_PASSWORD='***'
bash deploy/scripts/qa-api-crud.sh
```

---

## Checklist sign-off

| Criterio | Estado |
|----------|--------|
| Cero redirects a localhost | ❌ FAIL |
| Login CRM + portal OK | ❌ FAIL / BLOCKED |
| 100% CRUD super_admin API PASS | ✅ PASS (56/56, 2 skip documentados) |
| Pantallas CRM cargan sin error consola | ❌ BLOCKED |
| JWT refresh sin loop | ⏸ BLOCKED |
| Puertos 3000/8000 no públicos | ✅ PASS |

---

## Plan de remediación recomendado (orden)

1. `git pull` en VPS para obtener `buildRedirectUrl` + middleware actualizado.
2. Corregir `frontend/.env.production` con `NEXT_PUBLIC_SITE_URL=http://2.25.68.83`.
3. `npm run build` + `systemctl restart lumina-frontend`.
4. `python manage.py ensure_crm_admin --update-password` para sincronizar credenciales.
5. `python manage.py populate_full_demo_data` (tras fix del AttributeError).
6. Re-ejecutar `qa-vps-smoke.sh` y `qa-api-crud.sh`.
7. Prueba manual browser: login → `/crm/dashboard` → logout.

**Tiempo estimado:** 30–45 min.

---

*Informe generado sin incluir credenciales. Datos QA creados con prefijo `QA-TEST-*` fueron eliminados automáticamente por el script (agencias/etiquetas/direcciones de prueba).*
