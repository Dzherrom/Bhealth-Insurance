# Bhealth Insurance - Backend API

Un sistema de gestión integral (RESTful API) construido con **Django** y **Django REST Framework** para la administración de agencias de seguros de salud, agentes, clientes, pólizas, comisiones y automatización de firmas electrónicas.

## 🚀 Características Principales

- **Autenticación Segura:** Basada en JSON Web Tokens (JWT).
- **Gestión Jerárquica:** Administración de Agencias, Agentes y Clientes con soporte multirrol (Admin, Manager, Asistente, Sherpa, etc.).
- **Flujo de Trabajo Departamental:** Canalización de expedientes de pólizas a través de distintas etapas operativas.
- **Trazabilidad y Auditoría:** Registro de actividad global e historial automático de cambios (Diff Log) en pólizas.
- **Integraciones de Terceros:**
  - Integración nativa con **Zoho Sign** vía Webhooks asíncronos para firma de contratos.
- **Importación Masiva:** Procesamiento de lotes y cargas masivas desde CSV/Excel con lógica robusta para la prevención de registros duplicados.
- **Dashboard y Estadísticas:** Extracción de KPIs críticos de la empresa (volumen de pólizas, comisiones, reportes de estatus, carga de usuarios, mapas de calor, etc.).
- **Sistema de Archivos:** Gestión de documentos, licencias, consentimientos e imágenes categorizadas.

## 🛠 Stack Tecnológico

- **Lenguaje:** Python 3.11+
- **Framework:** Django / Django REST Framework
- **Base de Datos:**
  - Local: SQLite (`db.sqlite3`)
  - Producción: PostgreSQL (vía Render y `dj_database_url`)
- **Autenticación:** SimpleJWT
- **Despliegue:** [Render](https://render.com) (Configuración mediante `render.yaml`)

## 📑 Documentación de la API

La documentación técnica exhaustiva de la API, que incluye todos los endpoints CRUD, estructuras JSON, métodos HTTP y reglas de negocio, se encuentra separada en el siguiente archivo:

👉 **[Ver Documentación Detallada de la API (API_CRUD_DETAILED.md)](./API_CRUD_DETAILED.md)**

Para información concerniente a jerarquías, roles y permisos, consultar **[roles.md](./roles.md)**.

## ⚙️ Requisitos Previos

Asegúrate de tener instalados los siguientes componentes antes de iniciar:
- Python 3.11.5 o superior
- pip (Administrador de paquetes de Python)
- Git

## 💻 Instalación y Configuración Local

Sigue estos pasos para levantar el entorno de desarrollo en tu máquina local:

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
Puedes poblar tu base de datos local rápidamente con registros ficticios (agencias, agentes, pólizas, clientes con familias) usando el comando personalizado:
```bash
python manage.py populate_mock_data
```

**6. Levantar el servidor de desarrollo:**
```bash
python manage.py runserver
```
La API estará expuesta en `http://localhost:8000/`.

## ☁️ Despliegue en Producción (Render)

El despliegue está completamente automatizado y orquestado mediante IaC (Infrastructure as Code) usando Render.

El proceso lee el archivo de especificación `render.yaml` y ejecuta el script automatizado bash `build.sh`:
- Recolecta archivos estáticos (`collectstatic`).
- Ejecuta las migraciones de PostgreSQL (`migrate`).
- Verifica si es necesario inyectar entidades (`populate_mock_data`).

**Variables de Entorno Clave (`.env`):**
Cualquier instancia de producción requiere las siguientes variables:
- `SECRET_KEY`: Llave de seguridad de Django.
- `DEBUG`: `False`.
- `DATABASE_URL`: URI de conexión a la base de datos PostgreSQL de producción.
- `WEB_CONCURRENCY`: Control de trabajadores uvicorn/gunicorn.

## 👥 Contribución

1. Crea un branch para tu característica (`git checkout -b feature/NuevaCaracteristica`).
2. Haz commit de tus cambios (`git commit -m 'Añadir Nueva Caracteristica'`).
3. Empuja los cambios al branch (`git push origin feature/NuevaCaracteristica`).
4. Abre un Pull Request contra la rama `dev`.