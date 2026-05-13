# Bhealth Insurance - Backend API

Un sistema de gesti贸n integral (RESTful API) construido con **Django** y **Django REST Framework** para la administraci贸n de agencias de seguros de salud, agentes, clientes, p贸lizas, comisiones y automatizaci贸n de firmas electr贸nicas.

## 馃殌 Caracter铆sticas Principales

- **Autenticaci贸n Segura:** Basada en JSON Web Tokens (JWT).
- **Gesti贸n Jer谩rquica:** Administraci贸n de Agencias, Agentes y Clientes con soporte multirrol (Admin, Manager, Asistente, Sherpa, etc.).
- **Flujo de Trabajo Departamental:** Canalizaci贸n de expedientes de p贸lizas a trav茅s de distintas etapas operativas.
- **Trazabilidad y Auditor铆a:** Registro de actividad global e historial autom谩tico de cambios (Diff Log) en p贸lizas.
- **Integraciones de Terceros:**
  - Integraci贸n nativa con **Zoho Sign** v铆a Webhooks as铆ncronos para firma de contratos.
- **Importaci贸n Masiva:** Procesamiento de lotes y cargas masivas desde CSV/Excel con l贸gica robusta para la prevenci贸n de registros duplicados.
- **Dashboard y Estad铆sticas:** Extracci贸n de KPIs cr铆ticos de la empresa (volumen de p贸lizas, comisiones, reportes de estatus, carga de usuarios, mapas de calor, etc.).
- **Sistema de Archivos:** Gesti贸n de documentos, licencias, consentimientos e im谩genes categorizadas.

## 馃洜 Stack Tecnol贸gico

- **Lenguaje:** Python 3.11+
- **Framework:** Django / Django REST Framework
- **Base de Datos:**
  - Local: SQLite (`db.sqlite3`)
  - Producci贸n: PostgreSQL (v铆a Render y `dj_database_url`)
- **Autenticaci贸n:** SimpleJWT
- **Despliegue:** [Render](https://render.com) (Configuraci贸n mediante `render.yaml`)

## 馃搼 Documentaci贸n de la API

La documentaci贸n t茅cnica exhaustiva de la API, que incluye todos los endpoints CRUD, estructuras JSON, m茅todos HTTP y reglas de negocio, se encuentra separada en el siguiente archivo:

馃憠 **[Ver Documentaci贸n Detallada de la API (API_CRUD_DETAILED.md)](./API_CRUD_DETAILED.md)**

Para informaci贸n concerniente a jerarqu铆as, roles y permisos, consultar **[roles.md](./roles.md)**.

## 鈿欙笍 Requisitos Previos

Aseg煤rate de tener instalados los siguientes componentes antes de iniciar:
- Python 3.11.5 o superior
- pip (Administrador de paquetes de Python)
- Git

## 馃捇 Instalaci贸n y Configuraci贸n Local

Sigue estos pasos para levantar el entorno de desarrollo en tu m谩quina local:

**1. Clonar el repositorio:**
```bash
git clone https://github.com/tu-usuario/Bhealth-Insurance.git
cd Bhealth-Insurance
```

**2. Crear y activar el entorno virtual:**
```bash
python -m venv venv
# En Windows:
.\venv\Scripts\Activate.ps1
# En macOS/Linux:
source venv/bin/activate
```

**3. Instalar las dependencias:**
```bash
pip install -r requirements.txt
```

**4. Aplicar las migraciones de la base de datos:**
```bash
cd backend
python manage.py migrate
```

**5. (Opcional) Generar datos de prueba (Mock Data):**
Puedes poblar tu base de datos local r谩pidamente con registros ficticios (agencias, agentes, p贸lizas, clientes con familias) usando el comando personalizado:
```bash
python manage.py populate_mock_data
```

**6. Levantar el servidor de desarrollo:**
```bash
python manage.py runserver
```
La API estar谩 expuesta en `http://localhost:8000/`.

## 鈽侊笍 Despliegue en Producci贸n (Render)

El despliegue est谩 completamente automatizado y orquestado mediante IaC (Infrastructure as Code) usando Render.

El proceso lee el archivo de especificaci贸n `render.yaml` y ejecuta el script automatizado bash `build.sh`:
- Recolecta archivos est谩ticos (`collectstatic`).
- Ejecuta las migraciones de PostgreSQL (`migrate`).
- Verifica si es necesario inyectar entidades (`populate_mock_data`).

**Variables de Entorno Clave (`.env`):**
Cualquier instancia de producci贸n requiere las siguientes variables:
- `SECRET_KEY`: Llave de seguridad de Django.
- `DEBUG`: `False`.
- `DATABASE_URL`: URI de conexi贸n a la base de datos PostgreSQL de producci贸n.
- `WEB_CONCURRENCY`: Control de trabajadores uvicorn/gunicorn.

## 馃懃 Contribuci贸n

1. Crea un branch para tu caracter铆stica (`git checkout -b feature/NuevaCaracteristica`).
2. Haz commit de tus cambios (`git commit -m 'A帽adir Nueva Caracteristica'`).
3. Empuja los cambios al branch (`git push origin feature/NuevaCaracteristica`).
4. Abre un Pull Request contra la rama `dev`.

## 趌timas Actualizaciones (Rama Dev)
- **Notas y Recordatorios de P髄iza:** Integraci髇 CRUD bidireccional, permitiendo edici髇 en vivo en la p醙ina de Detalles.
- **Directorio de Documentos Din醡ico:** Soporte multiformato clasificado por categor韆s ('CARTA_MERCADO', 'ASEGURANZA', etc.) para subida de achivos (multipart/form-data).
- **M骴ulo de Configuraciones de Agencia:** Endpoints y vistas acopladas para configurar variables globales como: T韙ulo de Portal, Notificaciones del Sistema y Usuarios Facturados.
