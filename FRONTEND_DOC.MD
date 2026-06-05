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

1. Necesito eliminar el boton de cerrar sesion de la parte inferior izquierda en el sidebar del CRM. 

2. Quiero que los checkboxes de la pagina de polizas esten desmarcados al acceder y que se guarde cual esta marcado en la configuracion de la cuenta. De modo que si el usuario nelson tiene marcado solo 2026, cuando cierre sesion y vuelva a abrir la app este marcado solo 2026 con los ultimos filtros que uso. 

3. Necesito que la pagina de usuarios solo sea visible para los usuarios con el rol MANAGER y ADMIN. 

4. el slidebar del CRM tiene una animacion de relleno en los iconos. Me gustaria eliminar esa animacion de relleno ya que se rellena por completo y muchos iconos pierden el sentido porque no se ve nada. Solo asegurate de que ser mantenga el sombreado leve al tener el cursor encima. 

5. Necesito crear los tipos de producto en el sistema para crear una poliza, agregar un tipo de producto al moidelo de las polizas y verificar que sea obligatorio, las polizas no pueden crearse sin tipo de producto y este dicta los planes . 
Tipos de producto: 
5.1 Medicare: seguro de salud del gobierno para personas mayores de 55 años con ciertas discapacidades. 
5.2 Medicaid: Programa estatal y federal que ofrece cobertura medica a personas y familias de bajos ingresos.
5.3 Health insurance (ACA): Planes del mercado bajo la ley del cuidado de salud asequible con beneficios esenciales y subsidios. 
5.4 Life insurancec: Proteccion financiera para sus seres queridos en caso de fallecimiento.
5.5 Private: Planes de salud ofrecidos fuera de programas gubernamentales con opciones de cobertura personalizadas.
5.6 Dental: Cobertura para limpiezas, tratamientos basicos y servicios dentales mayores. 
5.7 Vision: Seguro que cubre examenes de la vista, anteojos, lentes de contacto y mas. 
5.8 Suplemental: Seguro adicional que paga beneficios por eventos especificos como accidentes, enfermedades graves u hospitalizaciones. 
5.9 Annuities: Productos financieros que brindan ingresos garantizados generalmente para la jubilacion.
5.10 Final expense: Seguro de vida accesible para cubrir gastos funerarios y de fin de vida. 
5.11 Travel: Cobertura para emergencias medicas cancelaciones y problemas durante tus viajes. 
5.12 Property & Casualty (P&C): Proteccion para tus bienes y riesgo de responsabilidad incluyendo seguros de hogar y auto. 