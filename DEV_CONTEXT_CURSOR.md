# Bhealth-Insurance — Desarrollo (Contexto para "cursor")

Propósito: este documento consolida el contexto técnico y operativo del proyecto Bhealth-Insurance (backend + frontend), incluyendo decisiones recientes, cambios aplicados, problemas abiertos, comandos de desarrollo y pasos recomendados para que una herramienta o desarrollador (p. ej. un cursor/agent) pueda continuar el trabajo sin perder la trama.

---

## Resumen rápido
- Stack: Django (DRF) backend + Next.js frontend (React + TypeScript, Zustand). Autenticación: JWT (rest_framework_simplejwt). DB: sqlite3 en workspace (puede ser Postgres en prod). 
- Ruta del repo: `c:\Users\skrea\Documents\Code\Bhealth-Insurance`
- Objetivo de este archivo: ser consumible por un cursor/agent para seguir trabajando (resumen + puntos de entrada + comandos reproducibles).

---

## Estado actual (resumen de la sesión)
- Backend: nuevas migraciones aplicadas para `Medicamento.poliza` y `TipoProducto` (migrations 0042..0046). Modelos añadidos: `TipoProducto`; `UserProfile` tiene `settings: JSONField`.
- Frontend:
  - `frontend/lib/api.ts`: central API wrapper; implementado `fetchWithAuth` con cola y `isRefreshing` para refresh token; añadido rate-limiter simple configurable con `NEXT_PUBLIC_API_MIN_INTERVAL_MS`.
  - `frontend/components/configuraciones/*`: múltiples refactors: `AgenciaConfig`, `EtiquetasConfig`, `InfoRow`, `UsuariosFacturadosConfig`, etc.
  - Token refresh loop mitigado: eliminado doble interceptor global y consolidado en `fetchWithAuth`.
- Problemas resueltos durante la sesión: creación e2e de póliza (migración aplicada), cotizaciones filtro (backend), errores de null en `PolizaDetails`, bloqueo infinito de refresh JWT, parse error JSX en `AgenciaConfig`.
- Problemas recientes y pendientes:
  - Mojibake (caracteres acentuados mostrados como `Ã©`, `Ãš`, etc.) detectado en la tarjeta de `AgenciaConfig`. Se añadió corrección en `InfoRow` y reemplazo con escapes Unicode en `AgenciaConfig`. Nota: si el texto en BD está corrupto, puede requerir limpieza en la DB.
  - A veces aparecen 401 en llamadas a `/agencias/` si las peticiones usan módulos que no inyectan headers (se migró a `agenciasApi`/`fetchWithAuth` pero pueden quedar usos legacy como `services/api`).
  - Recomendación: correr una verificación para localizar usos de `services/api` y migrarlos.

---

## Cambios clave (archivos modificados o añadidos)
- frontend/lib/api.ts — fetchWithAuth, rate limiter, createCrudApi helpers, `agenciasApi`, `etiquetasApi`, `tiposProductoApi`, `api` export.
- frontend/components/configuraciones/AgenciaConfig.tsx — migrado para usar `agenciasApi`, uso de `patchFormData` para uploads, Unicode escape aplicado en la línea de "Última actualización".
- frontend/components/configuraciones/InfoRow.tsx — añadido `fixMojibake` para heurística de corrección de mojibake; normaliza labels y valores de texto.
- frontend/components/configuraciones/EtiquetasConfig.tsx — forzado color por defecto y render inline del color para evitar que CSS o el Badge lo oculte.
- frontend/components/configuraciones/UsuariosFacturadosConfig.tsx — sustituido `services/api` por `fetchWithAuth` + `API_BASE_URL`.

---

## Comandos importantes
- Iniciar backend (virtualenv asumido):

```powershell
cd backend
..\venv\Scripts\python.exe manage.py migrate
..\venv\Scripts\python.exe manage.py runserver
```

- Iniciar frontend:

```powershell
cd frontend
npm install   # si es necesario
npm run dev
```

- Variables de entorno útiles (frontend):
  - `NEXT_PUBLIC_API_URL` — apuntar al backend (ej. `http://127.0.0.1:8000/api`).
  - `NEXT_PUBLIC_API_MIN_INTERVAL_MS` — mínimo intervalo entre requests (ms) para limitar tokens (por defecto añadido: 20 ms). Ajustar a 50-100 ms para menor carga.

---

## Diagnósticos y utilidades rápidas
- Buscar usos legacy que no usan `fetchWithAuth`:

```bash
# desde la raíz del repo
# buscar imports a services/api
rg "@/services/api" -n || true
```

- Localizar archivos con llamadas directas a `fetch(` sin pasar por `fetchWithAuth`:

```bash
rg "fetch\(" -n frontend | rg -v "fetchWithAuth|agenciasApi|etiquetasApi|polizasApi" || true
```

- Hacer backup y corregir mojibake en DB (opcional): se puede ejecutar un script Django management command que busque patrones con `Ã`/`Â` en columnas text y los vuelva a decodificar. Puedo generarlo si quieres (recomendado hacer backup antes).

---

## Cómo consumir este archivo desde un cursor/agent
1. Abrir este archivo `DEV_CONTEXT_CURSOR.md` en el workspace root.
2. Cargar el proyecto (instalar deps si es necesario) y ejecutar los comandos arriba.
3. Flujo recomendado para el cursor:
   - Ejecutar linters/grep para localizar llamadas a `services/api` u otros puntos no migrados.
   - Ejecutar pruebas unitarias (si existen) o lanzar `npm run dev` y `manage.py runserver` y reproducir casos: `/crm/configuraciones`.
   - Si detecta mojibake persistente en BD, correr script de corrección (crear si no existe).
   - Validar tokens: asegurar que `localStorage` tiene `access_token` y `refresh_token` en la sesión de desarrollo.

---

## Sugerencias de siguientes pasos (priorizadas)
1. Ejecutar grep/inspección para migrar todas las llamadas a `services/api` hacia `fetchWithAuth`/`agenciasApi`/`etiquetasApi`.
2. Analizar la base de datos para ver si campos de `Agencia` (por ejemplo `titulo_portal`, `pie_email`) ya están guardados con mojibake; si sí, ejecutar script para decodificarlos y guardar correctamente.
3. Añadir pruebas E2E que cubran creación/visualización de `Agencia` y verifiquen caracteres acentuados.
4. Opcional: mejorar el rate-limiter a un token-bucket por minuto si hay un límite global de tokens (2M tokens/min solicitado); ajustar `NEXT_PUBLIC_API_MIN_INTERVAL_MS` y/o agregar agrupación de requests en lotes.

---

## Nota sobre la corrección de mojibake aplicada
- Se añadió una heurística rápida en `InfoRow` (`fixMojibake`) para corregir textos renderizados que presentan patrones comunes (`Ã`/`Â`).
- Esto corrige la visualización temporalmente en UI sin tocar la BD. Si los datos en la BD están ya corrompidos, lo correcto es limpiar los registros en origen (script de migración o management command).

---

## Si quieres que ejecute acciones ahora
- Puedo generar y ejecutar un `management command` para detectar/corregir cadenas mojibake en la DB (haré backup antes si me das OK).
- Puedo buscar y migrar automáticamente los usos de `services/api` a `fetchWithAuth` en todo el frontend.

Indica la(s) acción(es) que quieres que ejecute y la pongo en marcha.

---

Fecha de creación: 2026-06-08
Generado por: resumen automático del chat de desarrollo

