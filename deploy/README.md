# Lumina Insurance — VPS deploy templates

Plantillas para el paso 7+ de la guía Hostinger. **No se instalan solas**: cópialas al sistema en el VPS.

## Rutas asumidas

| Recurso | Ruta en VPS |
|---------|-------------|
| Código | `/var/www/Bhealth-Insurance` |
| venv Python | `/var/www/Bhealth-Insurance/venv` |
| Backend `.env` | `/var/www/Bhealth-Insurance/backend/.env` |

Si clonas en otra carpeta (p. ej. `/var/www/lumina-insurance`), edita las rutas en los archivos `.service` y nginx antes de copiar.

## Paso 7 — Backend (Gunicorn + systemd)

```bash
sudo cp deploy/systemd/lumina-backend.service /etc/systemd/system/
sudo chown -R www-data:www-data /var/www/Bhealth-Insurance/backend/media
sudo chown -R www-data:www-data /var/www/Bhealth-Insurance/backend/staticfiles
sudo chmod 600 /var/www/Bhealth-Insurance/backend/.env
sudo systemctl daemon-reload
sudo systemctl enable lumina-backend
sudo systemctl start lumina-backend
sudo systemctl status lumina-backend
```

## Paso 8 — Frontend (Next.js + systemd)

### Permisos (evitar EACCES)

**Build siempre como `deploy`.** Solo pasa a `www-data` **después** de `npm run build`.

```bash
# Si ya hiciste chown www-data y npm falla con EACCES, recupera ownership:
sudo chown -R deploy:deploy /var/www/Bhealth-Insurance/frontend
```

**Importante:** haz el build **antes** de `chown www-data`. Si el servicio falla con `exit-code`, revisa logs:

```bash
sudo journalctl -u lumina-frontend -n 50 --no-pager
```

Causas frecuentes:
- Falta `npm run build` → no existe la carpeta `.next`
- `chown www-data` **antes** del build → `EACCES` en `npm ci` / `npm run build`
- Permisos: `www-data` debe leer `frontend/`, `.next/` y `node_modules/` **solo al ejecutar el servicio**

```bash
cd /var/www/Bhealth-Insurance/frontend
npm ci && npm run build
```

**Importante — evitar redirects a `localhost:3000`:**

Crea `frontend/.env.production` antes del build:

```env
NEXT_PUBLIC_SITE_URL=http://2.25.68.83
```

Sin esto, el middleware puede redirigir a `localhost:3000` detrás de Nginx.

```bash
sudo chown -R www-data:www-data /var/www/Bhealth-Insurance/frontend
sudo cp deploy/systemd/lumina-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable lumina-frontend
sudo systemctl start lumina-frontend
sudo systemctl status lumina-frontend
```

### Actualizar frontend en el futuro

```bash
# git pull falla si frontend pertenece a www-data — recuperar ownership primero:
sudo chown -R deploy:deploy /var/www/Bhealth-Insurance/frontend
cd /var/www/Bhealth-Insurance
git pull
cd frontend
npm ci && npm run build
sudo chown -R www-data:www-data /var/www/Bhealth-Insurance/frontend
sudo systemctl restart lumina-frontend
```

### Actualizar todo el repo (backend + frontend)

```bash
sudo chown -R deploy:deploy /var/www/Bhealth-Insurance
cd /var/www/Bhealth-Insurance
git pull
source venv/bin/activate
pip install -r requirements.txt
cd backend && python manage.py migrate && python manage.py collectstatic --noinput
cd ../frontend && npm ci && npm run build
sudo chown -R www-data:www-data /var/www/Bhealth-Insurance/frontend
sudo chown -R www-data:www-data /var/www/Bhealth-Insurance/backend/media
sudo chown -R www-data:www-data /var/www/Bhealth-Insurance/backend/staticfiles
sudo systemctl restart lumina-backend lumina-frontend
```

## Paso 9 — Nginx

Incluye `/api/`, `/admin/` (Django admin) y `/static/` (Whitenoise).

```bash
sudo cp deploy/nginx/lumina-insurance.conf /etc/nginx/sites-available/lumina-insurance
sudo ln -sf /etc/nginx/sites-available/lumina-insurance /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## Paso 10 — Firewall (cerrar puertos 3000 y 8000)

Solo deben ser públicos **22** (SSH), **80** y **443** (Nginx).

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw deny 3000/tcp
sudo ufw deny 8000/tcp
sudo ufw enable
sudo ufw status verbose
```

También revisa el **firewall del panel Hostinger** (solo 22, 80, 443).

## Frontend solo en localhost (127.0.0.1)

Si `ss -tlnp` muestra `*:3000`, el servicio no está limitado a localhost. Aplica el unit file actualizado:

```bash
sudo cp deploy/systemd/lumina-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart lumina-frontend
sudo ss -tlnp | grep 3000
# debe mostrar: 127.0.0.1:3000
```

## CRM super-admin (SUPER_ADMIN)

Crea usuario Django + rol CRM. Añade en `backend/.env`:

```env
DJANGO_SUPERUSER_USERNAME=lumina-admin
DJANGO_SUPERUSER_EMAIL=admin@tu-dominio.com
DJANGO_SUPERUSER_PASSWORD=ContraseñaSegura123!
```

En el VPS:

```bash
cd /var/www/Bhealth-Insurance/backend
source ../venv/bin/activate
python manage.py ensure_crm_admin
```

| Acceso | URL |
|--------|-----|
| CRM (login empleados) | `http://2.25.68.83/auth/login` |
| Django admin | `http://2.25.68.83/admin/` |

Para resetear contraseña de un usuario existente:

```bash
python manage.py ensure_crm_admin --update-password
```

## Comprobar

```bash
# Backend debe estar activo (si falla → 502 en /admin/ y /api/)
sudo systemctl status lumina-backend
curl -I http://127.0.0.1:8000/api/
curl -I http://127.0.0.1:8000/admin/

curl -I http://127.0.0.1:3000/
curl -I http://2.25.68.83/
curl -I http://2.25.68.83/api/
curl -I http://2.25.68.83/admin/
```

## Troubleshooting — 502 Bad Gateway en /admin/ o Failed to fetch

### Arquitectura (el frontend NO habla con PostgreSQL)

```
Navegador → Nginx :80 → Next.js :3000   (páginas)
Navegador → Nginx :80 → Gunicorn :8000  (/api/, /admin/)
Gunicorn → PostgreSQL localhost:5432    (solo Django)
```

**502** = Nginx no alcanza Gunicorn en `127.0.0.1:8000`. No es CORS ni CSRF.

```bash
sudo systemctl status lumina-backend
sudo journalctl -u lumina-backend -n 50 --no-pager
sudo ss -tlnp | grep 8000
```

Arrancar o reiniciar backend:

```bash
sudo cp deploy/systemd/lumina-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable lumina-backend
sudo systemctl restart lumina-backend
```

Probar DB manualmente:

```bash
cd /var/www/Bhealth-Insurance/backend
source ../venv/bin/activate
python manage.py migrate
python manage.py check
```

### Failed to fetch en login

1. **Backend caído** → arreglar lumina-backend (arriba).
2. **Frontend apuntando a Render** → rebuild con `/api` relativo o `NEXT_PUBLIC_API_URL=http://2.25.68.83/api`.
3. **CORS/ALLOWED_HOSTS** → en `backend/.env`:

```env
BACKEND_PUBLIC_URL=http://2.25.68.83
FRONTEND_ORIGINS=http://2.25.68.83
ALLOWED_HOSTS=2.25.68.83,srv1781611.hstgr.cloud
```

```bash
sudo systemctl restart lumina-backend
```

4. **Permisos `.env`** (gunicorn como www-data):

```bash
sudo chown deploy:www-data /var/www/Bhealth-Insurance/backend/.env
sudo chmod 640 /var/www/Bhealth-Insurance/backend/.env
```

### Rebuild frontend tras cambios de API

```bash
sudo chown -R deploy:deploy /var/www/Bhealth-Insurance/frontend
cd /var/www/Bhealth-Insurance/frontend
git pull
npm run build
sudo chown -R www-data:www-data /var/www/Bhealth-Insurance/frontend
sudo systemctl restart lumina-frontend
```

## Renombrar a Lumina

Los nombres de servicio (`lumina-backend`, `lumina-frontend`) y nginx (`lumina-insurance`) son solo etiquetas del SO. **No cambian** módulos Django, tablas de DB ni imports del código.

---

# Pasos 11 en adelante

## Paso 11 — Verificación completa

Ejecuta el script de comprobación (después de `git pull`):

```bash
chmod +x deploy/scripts/verify-deploy.sh
bash deploy/scripts/verify-deploy.sh
```

### Checklist manual

| # | Qué probar | Cómo |
|---|-----------|------|
| 1 | Servicios activos | `sudo systemctl status lumina-backend lumina-frontend nginx` |
| 2 | Backend local | `curl -I http://127.0.0.1:8000/api/` |
| 3 | Admin Django | `curl -I http://2.25.68.83/admin/` → no 502 |
| 4 | Frontend público | Abrir `http://2.25.68.83/auth/login` |
| 5 | Login CRM | Usuario `lumina-admin` + contraseña del `.env` |
| 6 | Puertos cerrados | `:3000` y `:8000` no accesibles desde fuera |
| 7 | DevTools (F12) | Login llama a `http://2.25.68.83/api/login/` (no Render) |

### Si algo falla

```bash
sudo journalctl -u lumina-backend -n 30 --no-pager
sudo journalctl -u lumina-frontend -n 30 --no-pager
sudo nginx -t
```

---

## Paso 12 — Fail2ban (protección SSH)

```bash
sudo apt install -y fail2ban
sudo cp deploy/fail2ban/jail.local /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
sudo fail2ban-client status sshd
```

Tras **3 intentos fallidos de SSH en 10 minutos**, la IP se bloquea **1 hora**.

Desbloquear tu IP si te quedas fuera (desde consola Hostinger):

```bash
sudo fail2ban-client set sshd unbanip TU_IP_PUBLICA
```

---

## Paso 13 — Backups automáticos de PostgreSQL

```bash
sudo mkdir -p /var/backups/lumina
sudo chown deploy:deploy /var/backups/lumina
chmod +x deploy/scripts/backup-db.sh

# Prueba manual
bash deploy/scripts/backup-db.sh
ls -lh /var/backups/lumina/
```

Cron diario (como `deploy`):

```bash
crontab -e
```

Añade:

```cron
0 3 * * * /var/www/Bhealth-Insurance/deploy/scripts/backup-db.sh >> /var/backups/lumina/backup.log 2>&1
```

Restaurar un backup (emergencia):

```bash
gunzip -c /var/backups/lumina/lumina_db_YYYYMMDD_HHMMSS.sql.gz | psql "$DATABASE_URL"
```

---

## Paso 14 — Actualizaciones de seguridad del SO

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Revisión mensual manual:

```bash
sudo apt update && sudo apt upgrade -y
sudo reboot   # solo si el kernel se actualizó
```

---

## Paso 15 — Script de deploy futuro (git pull → rebuild)

Tras cada `git push` desde tu PC:

```bash
chmod +x deploy/scripts/update-app.sh
bash deploy/scripts/update-app.sh
bash deploy/scripts/verify-deploy.sh
```

---

## Paso 16 — Dominio + HTTPS (cuando lo tengas)

1. Registro **A** en DNS → `2.25.68.83`
2. Actualizar `backend/.env`:

```env
BACKEND_PUBLIC_URL=https://tu-dominio.com
FRONTEND_ORIGINS=https://tu-dominio.com
ALLOWED_HOSTS=tu-dominio.com,2.25.68.83
```

3. Actualizar `frontend/.env.production`:

```env
NEXT_PUBLIC_API_URL=https://tu-dominio.com/api
```

4. SSL:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

5. Rebuild + restart:

```bash
bash deploy/scripts/update-app.sh
```

6. Probar: `https://tu-dominio.com/auth/login`

---

## Paso 17 — Mantenimiento Hostinger

| Tarea | Frecuencia |
|-------|------------|
| `verify-deploy.sh` | Tras cada deploy |
| Revisar logs backend | Semanal |
| Backup manual extra antes de migraciones grandes | Según necesidad |
| Rotar `SECRET_KEY` / contraseñas si hubo filtración | Inmediato |
| Snapshot VPS en hPanel | Antes de cambios grandes |

---

## Resumen final

| Paso | Estado |
|------|--------|
| 7 Backend Gunicorn | ✅ |
| 8 Frontend Next.js | ✅ |
| 9 Nginx | ✅ |
| 10 Firewall UFW | ⬜ confirmar |
| 11 Verificación | ⬜ `verify-deploy.sh` |
| 12 Fail2ban | ⬜ |
| 13 Backups DB | ⬜ |
| 14 unattended-upgrades | ⬜ |
| 15 update-app.sh | ⬜ |
| 16 HTTPS + dominio | ⬜ cuando tengas dominio |
