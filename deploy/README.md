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
sudo chown -R www-data:www-data /var/www/Bhealth-Insurance/frontend
sudo cp deploy/systemd/lumina-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable lumina-frontend
sudo systemctl start lumina-frontend
sudo systemctl status lumina-frontend
```

### Actualizar frontend en el futuro

```bash
sudo chown -R deploy:deploy /var/www/Bhealth-Insurance/frontend
cd /var/www/Bhealth-Insurance/frontend
git pull
npm ci && npm run build
sudo chown -R www-data:www-data /var/www/Bhealth-Insurance/frontend
sudo systemctl restart lumina-frontend
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
curl -I http://127.0.0.1:8000/api/
curl -I http://127.0.0.1:3000/
curl -I http://2.25.68.83/
curl -I http://2.25.68.83/api/
curl -I http://2.25.68.83/admin/

# Desde tu PC — deben fallar (timeout / refused) si el firewall está bien:
curl --connect-timeout 5 http://2.25.68.83:3000
curl --connect-timeout 5 http://2.25.68.83:8000
```

## Renombrar a Lumina

Los nombres de servicio (`lumina-backend`, `lumina-frontend`) y nginx (`lumina-insurance`) son solo etiquetas del SO. **No cambian** módulos Django, tablas de DB ni imports del código.
