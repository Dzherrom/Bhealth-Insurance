# Roles y Permisos — BHealth Insurance

Arquitectura alineada con los 8 departamentos operativos y los niveles de acceso del ecosistema CRM + Portal Cliente.

## Departamentos

| Código | Nombre | Función |
|--------|--------|---------|
| `RECEPCION` | Recepción | Canalización de llamadas entrantes |
| `SOPORTE_CLIENTE` | Soporte al Cliente | Retención y seguimiento proactivo |
| `GESTION_RESOLUCION` | Gestión y Resolución | Bills, incidencias y citas |
| `AREA_COMERCIAL` | Área Comercial | Ventas nuevas y alta de cuentas cliente |
| `HEALTH_SHERPA` | Health Sherpa | Inscripción/cambios en marketplace federal |
| `AGENTES` | Agentes | Inscripciones telefónicas fuera de web |
| `COBRANZA` | Cobranza | Pagos y fechas de cobro |
| `RECUPERACION` | Recuperación | Rescate de cartera cancelada/en riesgo |

## Roles del sistema

| Rol backend | Claim JWT | Departamento por defecto | Descripción |
|-------------|-----------|--------------------------|-------------|
| `SUPER_ADMIN` | `super_admin` | — | Control total del sistema |
| `LED` | `led` | — | Coordinador de departamento |
| `CLIENT_SUPPORT` | `client_support` | Área Comercial | Captación e inscripción comercial |
| `GESTION_RESOLUCION` | `gestion_resolucion` | Gestión y Resolución | Citas y postventa |
| `HEALTH_SHERPA` | `health_sherpa` | Health Sherpa | Sometimiento técnico en marketplace |
| `AGENTE` | `agente` | Agentes | Procesamiento telefónico |
| `COBRANZA` | `cobranza` | Cobranza | Conciliación de pagos |
| `RECUPERACION` | `recuperacion` | Recuperación | Reactivación de cartera |
| `RECEPCION` | `recepcion` | Recepción | Recepción de llamadas |
| `SOPORTE_CLIENTE` | `soporte_cliente` | Soporte al Cliente | Retención de clientes |

### Migración desde roles legacy

| Legacy | Nuevo |
|--------|-------|
| `ADMIN` | `SUPER_ADMIN` |
| `MANAGER` | `LED` |
| `ASISTENTE` | `CLIENT_SUPPORT` |
| `SHERPA` | `HEALTH_SHERPA` |
| `PAGOS` | `COBRANZA` |
| `CITAS` | `GESTION_RESOLUCION` |

Fuente de verdad en código: `backend/api/roles.py` y `frontend/lib/roles.ts`.

---

## SUPER ADMIN

Control total y privilegios globales sobre la configuración de la agencia.

- **Control de accesos:** usuarios, departamentos, cierre remoto de sesiones, historial de accesos
- **Seguridad (planificado):** 2FA obligatorio, bloqueo horario, restricción IP/VPN, timeout de inactividad
- **Creador de roles dinámicos:** plantillas desde roles existentes + matriz granular (UI pendiente)
- **Auditoría:** registro de quién, qué, cómo y cuándo
- **Exportación maestra:** Excel con todos los campos y metadatos
- **Centro global de mensajería:** banners y notificaciones masivas segmentadas por departamento

---

## LED (Coordinador de Departamento)

- Visibilidad de todas las pólizas con priorización departamental
- Asignación y reequilibrio de trabajo entre el equipo
- Puntos de experiencia a usuarios bajo supervisión
- Notificaciones visibles solo para su departamento
- Edición de campos sensibles (SSN, ingresos, etc.)
- Acciones masivas y archivado/desarchivado

---

## CLIENT SUPPORT (Área Comercial)

- Acompañamiento en tiempo real del llenado de formularios
- Cartera propia (solo clientes creados por el asistente)
- Bloqueo de impresión en páginas sensibles
- Sin acceso a SSN, cuentas bancarias completas ni descarga de documentos

---

## GESTIÓN Y RESOLUCIÓN

- Gestión de calendario: crear, modificar y reprogramar citas
- Estatus de citas: Confirmada, Realizada, Cancelada
- Recordatorios automáticos (SMS, email, app)
- **Restricción:** no modifica información de la cuenta del cliente

---

## HEALTH SHERPA y AGENTES

- Cambio de estatus de pólizas (solo estatus permitidos por Super Admin)
- Gestión documental: carga/descarga para plataformas gubernamentales
- Asignación de FFM ID
- Visibilidad por NPN (solo pólizas asociadas a su NPN)
- Sin creación de prospectos ni contacto directo con cliente (Sherpa)

---

## COBRANZA

- Estatus de pago: Paid, Pending Payment, Missed Payment
- Carga de evidencias y comprobantes
- Historial financiero (notas de pagos)
- **Restricción:** solo maneja estatus de pagos, no datos personales

---

## RECUPERACIÓN, RECEPCIÓN, SOPORTE AL CLIENTE

Roles operativos con visibilidad global de pólizas (según matriz) y funciones específicas de su departamento.

---

## Presencia y bloqueo de edición

- `GET/POST/DELETE /api/polizas/{id}/presence/` — usuarios en línea y bloqueo de edición
- Un solo editor por póliza (timeout 10 min); los demás ven solo lectura
- Heartbeat cada 30 s desde el frontend al abrir el detalle

## Archivado (sin eliminación)

- `POST /api/polizas/{id}/archivar/` — Super Admin / LED
- `POST /api/polizas/{id}/desarchivar/`
- `POST /api/polizas/archivar_lote/` — `{ "ids": [1,2,3] }`
- `DELETE /api/polizas/{id}/` → **405** (no hay borrado permanente)
- Listado excluye archivadas por defecto; `?archivada=1` o checkbox «Ver archivadas»


## Implementación técnica

| Capa | Archivo |
|------|---------|
| Backend roles | `backend/api/roles.py` |
| Permisos DRF | `backend/api/permissions.py` |
| Modelo departamento | `backend/api/models.py` → `Departamento` |
| Migración | `backend/api/migrations/0074_roles_departamentos.py` |
| API departamentos | `GET /api/departamentos/` |
| Frontend roles | `frontend/lib/roles.ts` |
| Permisos UI | `frontend/lib/permissions.ts` |
| Matriz dinámica | `MatrizPermisoRol` (tabla en BD) |
