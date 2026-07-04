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

```bash
sudo cp deploy/nginx/lumina-insurance.conf /etc/nginx/sites-available/lumina-insurance
sudo ln -sf /etc/nginx/sites-available/lumina-insurance /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## Comprobar

```bash
curl -I http://127.0.0.1:8000/api/
curl -I http://127.0.0.1:3000/
curl -I http://2.25.68.83/api/
```

## Renombrar a Lumina

Los nombres de servicio (`lumina-backend`, `lumina-frontend`) y nginx (`lumina-insurance`) son solo etiquetas del SO. **No cambian** módulos Django, tablas de DB ni imports del código.
