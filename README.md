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

## �ltimas Actualizaciones (Rama Dev)
- **Notas y Recordatorios de P�liza:** Integraci�n CRUD bidireccional, permitiendo edici�n en vivo en la p�gina de Detalles.
- **Directorio de Documentos Din�mico:** Soporte multiformato clasificado por categor�as ('CARTA_MERCADO', 'ASEGURANZA', etc.) para subida de achivos (multipart/form-data).
- **M�dulo de Configuraciones de Agencia:** Endpoints y vistas acopladas para configurar variables globales como: T�tulo de Portal, Notificaciones del Sistema y Usuarios Facturados.

Necesito que 
1. corrijas el registro de poliza:
1.1 Informacion de poliza: Se selecciona el tipo de producto, no el plan. Entre los tipos de producto existen medicare, medicaid, health insurance (ACA), life insurance, private, dental, vision, suplemental, annulities, final expense, travel, property & casualty (P&C). Modifica las polizas para que guarden un tipo de producto. En este apartado manten la fecha de efectividad y el agente registrado para este cliente. 
1.2 Informacion personal, esta correcto como esta.
1.3 Grupo Familiar, esta correcto como esta. 
1.4 Direccion: En este apartado se guarda la direccion FISICA. La unica obligatoria para registrar una poliza. He probado el apartado de condado segun el codigo postal y funciona de maravilla. 

2. Verifica que la poliza se cree correctamente desde este apartado y que siempre se cree una poliza con el estatus de poliza QUOTE, para que quede guardada en el apartado de crm/cotizaciones. En el apartado de crm/polizas no se deben mostrar las polizas que tengan el estado de poliza QUOTE. 

3. Verifica que los agentes asignados a una poliza siempre reciban una notificacion al realizarsele cualquier cambio a dicha poliza. 

4. Remueve el apartado de tareas, ya que este no se usa realmente en el sistema original. 

5. En la pagina de detalles de poliza hay un formulario para seleccionar el plan. Este formulario incluye: INFORMACION DE LA COBERTURA: Tipo de producto, aseguradora, nombre del plan (string), Fecha de efectividad (obligatorio), fecha de cancelacion, metal, ID del mercado, ID de miembro, ID del plan CMS, costo de la poliza, credito fiscal/subsidio, prima (pago mensual). INFORMACION DE LA POLIZA: Tipo de venta, FFM usado en el mercado ,NPN usado en el mercado, fecha de inscripcion periodo especial, razon isncripcion periodo especial. 

6. Agrega otra casilla string que sera detalles de poliza. 

7. Verifica que exista en esta pagina de detalles de poliza un apartado de EVENTO DE VIDA, donde se registrara cualquier solicitud de cambio de informacion de parte del cliente. Esta solicitud se guarda como "en proceso" y se puede marcar como completada para que tenga dicho estado. Los cambios de vida son: Nueva direccion (formulario de direccion), Cambio en los ingresos (Formulario: para quien es el cambio de ingresos (seleccionar un miembro de la poliza), Empleador y campo check de si trabaja por cuenta propia, telefono del empleador, cargo/ocupacion, ingresos anuales), cambio en estado migratorio(Formulario: para quien es el cambio y estatus migratorio), nuevo miembro en la familia(El mismo formulario para agregar conyuge o dependiente.), embarazo (Seleccionar el miembro de la familia embarazado), fallecido(Seleccionar el miembro fallecido y un apartado de notas), otros cambios(Campo string). Tambien verifica que exista un log de cambios de vida donde se muestre una lista de cambios realizados, a estos cambios realizados se les puede dar click y se desplegara la informacion editada y una comparacion antes y despues de los datos en texto. 

8. Los estatus de documento son Pendiente, procesado, rechazado, completado, expirado. 

9. Los estados de pago son Pendiente, pago automatico, fallido, pagado, no aplicable. 

10. Crea un boton en el header del dashboard que muesestre tres columnas, una con informacion del portal del usuario registrado, otra que diga HealthCare.gov. Con botones de iniciar sesion, pagina de inicio, para agentes y corredores, informacion fiscal y como pagar tu prima. Estos botones deben redirigir a cada uno de estos apartados en la pagina de healthcare.gov. 

11. Crea un apartado de medico principal y otro de medicamentos necesarios en las polizas y en la base de datos. 

12. Realiza todos los cambios necesarios para completar la implementacion de cada una de estas tareas y luego verifica la funcionalidad de cada una de ellas de modo que funcionen sin errores para el empleado. 