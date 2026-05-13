# Documentación del Frontend - Bhealth Insurance

Este documento detalla todas las rutas (URLs) disponibles en el proyecto, así como las instrucciones de configuración para el entorno de desarrollo local (Next.js conectado a Django).

## Configuración y Despliegue Local

El frontend (React/Next.js) ha sido configurado para que por defecto cuando lo ejecutes en local con `npm run dev`, intente conectarse al API que tienes en `http://127.0.0.1:8000/api`.

### Pasos para iniciar todo localmente:

1. **Backend (Puerto 8000):**
   Abre una terminal, navega a `backend`, activa tu entorno y arranca Django:
   ```bash
   cd backend
   source venv/Scripts/activate
   python manage.py runserver
   ```
2. **Frontend (Puerto 3000):**
   En una nueva terminal, navega a `frontend` e inicia NodeJS:
   ```bash
   cd frontend
   npm run dev
   ```

> **Nota sobre variables de entorno:**
> Si en el futuro necesitas apuntar a tu entorno de Render o otro host estando en local (o viceversa), puedes crear un archivo `.env.local` dentro de la carpeta `frontend/` y agregar:
> `NEXT_PUBLIC_API_URL="https://tu-url-de-render.onrender.com/api"`

---

## Estructura de Rutas y URLs del Sistema

A continuación se listan todas las páginas compiladas por Next.js a las que puedes acceder desde tu navegador mediante `http://localhost:3000`.

### 1. Páginas Generales de Acceso
| Ruta en Navegador | Archivo Físico | Descripción |
|-------------------|----------------|-------------|
| `/` | `app/page.tsx` | Landing page o página principal del sistema. |
| `/auth` | `app/auth/page.tsx` | Redirecciona automáticamente a `/auth/login` *(Se corrigió el error ya que estaba vacío)*. |
| `/auth/login` | `app/auth/login/page.tsx` | Página de inicio de sesión para agentes/usuarios. |
| `/auth/register` | `app/auth/register/page.tsx` | Formulario de registro o alta de cuenta. |

### 2. Panel CRM (Administrativo / Agentes)
| Ruta en Navegador | Archivo Físico | Descripción |
|-------------------|----------------|-------------|
| `/crm` | `app/crm/page.tsx` | Inicio del CRM. |
| `/crm/dashboard` | `app/crm/dashboard/page.tsx` | Las gráficas y estadísticas globales implementadas. **(El error 404/Compilación fue solucionado)**. |
| `/crm/polizas` | `app/crm/polizas/page.tsx` | Listado general de todas las pólizas, tabla de gestión. |
| `/crm/polizas/[id]` | `app/crm/polizas/[id]/page.tsx` | Reemplaza `[id]` por un número válido (Ej. `/crm/polizas/12`) para ver el detalle de una póliza. |
| `/crm/users` | `app/crm/users/page.tsx` | Gestión y tabla para visualizar perfiles de usuarios. |
| `/crm/configuraciones` | `app/crm/configuraciones/page.tsx` | Pantalla de ajustes internos y configuraciones del administrador. |
| `/crm/formularios-de-firmas`| `app/crm/formularios-de-firmas/page.tsx` | Pantalla para gestiones de firmas de consentimiento. |

### 3. Portal de Clientes (Acceso para Clientes Asegurados)
| Ruta en Navegador | Archivo Físico | Descripción |
|-------------------|----------------|-------------|
| `/client` | `app/client/page.tsx` | Dashboard general del cliente. |
| `/client/[clientId]` | `app/client/[clientId]/page.tsx` | (Sustituye `[clientId]` por el id) Vista para un cliente especifico. |
| `/client/[clientId]/profile` | `app/client/[clientId]/profile/page.tsx` | Perfil del cliente para ver sus datos/direccion. |
| `/client/[clientId]/configuraciones` | `app/client/[clientId]/configuraciones/page.tsx` | Ajustes por cliente (Cambio de pass, notificaciones). |

---

## Errores Solucionados (Historial Frontend)

- **Loop Infinito del Login hacia el Dashboard:** Anteriormente, el logearse con usuarios del CRM causaba que `middleware.ts` rebotara la petición para atrás entre `/auth/login` y `/crm/dashboard`. **Causa descubierta:** La base de datos de Django guarda los roles en Máyusculas (Ej: `ADMIN`), mientras que React tiene configurada la lista blanca en Minúsculas (`admin`). **Solución:** Se editó `lib/jwt.ts` para que procese independientemente un `.toLowerCase()` y se agregó lógica de limpieza de tokens corruptos en `app/auth/login/page.tsx`.
- **Indeterminate Console Error en Tablas de Recharts/Polizas:** Subsanado un error del tipo `Received "false" for a non-boolean attribute "indeterminate"` proveniente de la librería inferior subyacente que esperaba strings explícitos para React 19. El componente se limpió para enviar cadenas `"indeterminate"`.
- **Error `The default export is not a React Component in "/auth/page"`:** Ocurría porque Next.js intentaba procesar esa ruta pero el archivo `frontend/app/auth/page.tsx` estaba vacío (0 bytes). Se ha corregido introduciendo un componente que automáticamente te redirige a `/auth/login`.
- **Conexión Local vs Render:** En el archivo `frontend/lib/api.ts` y en el Dashboard tenías quemada la URL de producción de Render (`bhealth-insurance.onrender...`). Esto lo modificamos para que en tu entorno local utilice dinámicamente tu `127.0.0.1:8000/api` mediante un fallback. 


## Componentes y P�ginas Interactivas A�adidas
- **\/crm/configuraciones\**: Se activ� el panel de ajustes con sub-secciones para Agencia, Notificaciones, Usuarios Facturados y Etiquetas, conectados mediante \/api/agencias/\ y sus correspondientes endpoints.
- **Detalle de P�liza (\/crm/polizas/[id]\)**: 
  - **NotasPoliza**: M�dulo 100% din�mico con peticiones a la API para agregar, editar y eliminar notas asociadas a la p�liza actual.
  - **DocumentosPoliza**: Ahora provee una vista de 'directorios' que clasifica din�micamente seg�n categor�as de documentos (Consentimiento, ID, M�dico) permitiendo subida de archivos real.
  - **RecordatoriosPoliza**: Reflejando avisos din�micos en lista asociados a la tabla del backend.
