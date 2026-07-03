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

```bash
cd /var/www/Bhealth-Insurance/frontend
npm ci && npm run build
sudo cp deploy/systemd/lumina-frontend.service /etc/systemd/system/
sudo chown -R www-data:www-data /var/www/Bhealth-Insurance/frontend
sudo systemctl daemon-reload
sudo systemctl enable lumina-frontend
sudo systemctl start lumina-frontend
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
