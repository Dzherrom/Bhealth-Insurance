# API CRUD Documentation - Bhealth Insurance

Este documento proporciona ejemplos detallados de todos los endpoints CRUD del sistema, incluyendo todos los campos disponibles para cada recurso.

**Base URL:** `/api/`

**Autenticación:** JWT Token (Bearer Token)

## Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Agencias](#agencias)
3. [Direcciones](#direcciones)
4. [Agentes](#agentes)
5. [Clientes](#clientes)
6. [Aseguradoras](#aseguradoras)
7. [Planes](#planes)
8. [Pólizas](#pólizas)
9. [Notas](#notas)
10. [Tareas](#tareas)
11. [Citas](#citas)
12. [Documentos](#documentos)
13. [Recordatorios](#recordatorios)
14. [Notificaciones](#notificaciones)

---

## Autenticación

### Registro de Usuario
```
POST /api/register/
```

**Request Body:**
```json
{
  "username": "usuario123",
  "email": "usuario@ejemplo.com",
  "password": "contraseña_segura",
  "first_name": "Juan",
  "last_name": "Pérez"
}
```

### Login
```
POST /api/login/
```

**Request Body:**
```json
{
  "username": "usuario123",
  "password": "contraseña_segura"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Usar el Token
En todos los requests subsiguientes, incluir el header:
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## Agencias

**Endpoint Base:** `/api/agencias/`

### Listar Agencias
```
GET /api/agencias/
```

### Obtener Una Agencia
```
GET /api/agencias/{id}/
```

### Crear Agencia

```
POST /api/agencias/
Content-Type: application/json
```

**Request Body Completo (todos los campos disponibles):**
```json
{
  "nombre": "Agencia Salud Plus",
  "codigo_postal": "90001",
  "cliente_desde": "2024-01-15",
  "nombre_legal": "Agencia Salud Plus LLC",
  "dba": "Salud Plus",
  "telefono": "+1-555-123-4567",
  "email": "contacto@saludplus.com",
  "direccion_negocio": 1,
  "titulo_portal": "Portal de Clientes - Salud Plus",
  "pie_email": "Gracias por confiar en nosotros.\n\nAgencia Salud Plus\nTel: +1-555-123-4567\nEmail: contacto@saludplus.com"
}
```

**Notas sobre campos:**
- `nombre` (requerido): Nombre de la agencia
- `codigo_postal`: Código postal de la agencia
- `cliente_desde`: Fecha desde cuando es cliente (formato: YYYY-MM-DD)
- `nombre_legal`: Nombre legal/oficial de la empresa
- `dba`: "Doing Business As" - Nombre comercial
- `telefono`: Número de teléfono
- `email`: Correo electrónico
- `direccion_negocio`: ID de una Dirección previamente creada (opcional)
- `logo_light`: Logo para tema claro (archivo, usar multipart/form-data)
- `logo_dark`: Logo para tema oscuro (archivo, usar multipart/form-data)
- `favicon`: Icono favicon (archivo, usar multipart/form-data)
- `titulo_portal`: Título del portal web de la agencia
- `pie_email`: Firma/pie de página para correos electrónicos

**Para subir archivos (logos, favicon), usar multipart/form-data:**
```
POST /api/agencias/
Content-Type: multipart/form-data

nombre=Agencia Salud Plus
codigo_postal=90001
cliente_desde=2024-01-15
nombre_legal=Agencia Salud Plus LLC
dba=Salud Plus
telefono=+1-555-123-4567
email=contacto@saludplus.com
direccion_negocio=1
titulo_portal=Portal de Clientes - Salud Plus
pie_email=Gracias por confiar en nosotros...
logo_light=@/path/to/logo_light.png
logo_dark=@/path/to/logo_dark.png
favicon=@/path/to/favicon.ico
```

### Actualizar Agencia
```
PUT /api/agencias/{id}/
PATCH /api/agencias/{id}/
```

**Request Body (ejemplo parcial con PATCH):**
```json
{
  "telefono": "+1-555-999-8888",
  "email": "nuevo@saludplus.com",
  "pie_email": "Texto actualizado del pie de email"
}
```

### Eliminar Agencia
```
DELETE /api/agencias/{id}/
```

---

## Direcciones

**Endpoint Base:** `/api/direcciones/`

### Listar Direcciones
```
GET /api/direcciones/
```

### Obtener Una Dirección
```
GET /api/direcciones/{id}/
```

### Crear Dirección

```
POST /api/direcciones/
Content-Type: application/json
```

**Request Body Completo:**
```json
{
  "linea1": "123 Main Street",
  "linea2": "Apt 4B",
  "ciudad": "Los Angeles",
  "estado": "California",
  "zip_code": "90001",
  "condado": "Los Angeles County"
}
```

**Notas sobre campos:**
- `linea1` (requerido): Primera línea de dirección
- `linea2`: Segunda línea (opcional, ej: apartamento, suite)
- `ciudad` (requerido): Ciudad
- `estado` (requerido): Estado
- `zip_code` (requerido): Código postal
- `condado` (requerido): Condado

### Actualizar Dirección
```
PUT /api/direcciones/{id}/
PATCH /api/direcciones/{id}/
```

### Eliminar Dirección
```
DELETE /api/direcciones/{id}/
```

---

## Agentes

**Endpoint Base:** `/api/agentes/`

### Listar Agentes
```
GET /api/agentes/
```

### Obtener Un Agente
```
GET /api/agentes/{id}/
```

### Crear Agente

```
POST /api/agentes/
Content-Type: application/json
```

**Request Body Completo:**
```json
{
  "npn": "12345678",
  "nombre_completo": "María González López",
  "agencia": 1
}
```

**Notas sobre campos:**
- `npn` (requerido, único): Número Nacional de Productor
- `nombre_completo` (requerido): Nombre completo del agente
- `agencia` (requerido): ID de la Agencia a la que pertenece

### Actualizar Agente
```
PUT /api/agentes/{id}/
PATCH /api/agentes/{id}/
```

### Eliminar Agente
```
DELETE /api/agentes/{id}/
```

---

## Clientes

**Endpoint Base:** `/api/clientes/`

### Listar Clientes
```
GET /api/clientes/
```

### Obtener Un Cliente
```
GET /api/clientes/{id}/
```

### Crear Cliente

```
POST /api/clientes/
Content-Type: application/json
```

**Request Body Completo:**
```json
{
  "primer_nombre": "Carlos",
  "segundo_nombre": "Alberto",
  "apellido_paterno": "Rodríguez",
  "apellido_materno": "García",
  "genero": "Masculino",
  "fecha_nacimiento": "1985-06-15",
  "ssn": "123-45-6789",
  "email": "carlos.rodriguez@email.com",
  "telefono": "+1-555-234-5678",
  "ingreso_anual": "45000.00",
  "estado_civil": "Casado",
  "pais_nacimiento": "México",
  "estado_inmigracion": "Residente Permanente",
  "categoria_inmigracion": "Green Card Holder"
}
```

**Notas sobre campos:**
- `primer_nombre` (requerido): Primer nombre
- `segundo_nombre`: Segundo nombre (opcional)
- `apellido_paterno` (requerido): Apellido paterno
- `apellido_materno`: Apellido materno (opcional)
- `genero` (requerido): Género del cliente
- `fecha_nacimiento` (requerido): Fecha de nacimiento (YYYY-MM-DD)
- `ssn` (requerido, único): Número de Seguro Social
- `email` (requerido): Correo electrónico
- `telefono` (requerido): Número de teléfono
- `ingreso_anual` (requerido): Ingreso anual (decimal)
- `estado_civil` (requerido): Estado civil
- `pais_nacimiento` (requerido): País de nacimiento
- `estado_inmigracion` (requerido): Estado de inmigración
- `categoria_inmigracion`: Categoría de inmigración (opcional)

### Actualizar Cliente
```
PUT /api/clientes/{id}/
PATCH /api/clientes/{id}/
```

**Request Body (ejemplo parcial):**
```json
{
  "telefono": "+1-555-999-0000",
  "email": "nuevo_email@email.com",
  "ingreso_anual": "50000.00"
}
```

### Eliminar Cliente
```
DELETE /api/clientes/{id}/
```

---

## Aseguradoras

**Endpoint Base:** `/api/aseguradoras/`

### Listar Aseguradoras
```
GET /api/aseguradoras/
```

### Obtener Una Aseguradora
```
GET /api/aseguradoras/{id}/
```

### Crear Aseguradora

```
POST /api/aseguradoras/
Content-Type: application/json
```

**Request Body Completo:**
```json
{
  "nombre": "Blue Cross Blue Shield"
}
```

**Notas sobre campos:**
- `nombre` (requerido): Nombre de la aseguradora

### Actualizar Aseguradora
```
PUT /api/aseguradoras/{id}/
PATCH /api/aseguradoras/{id}/
```

### Eliminar Aseguradora
```
DELETE /api/aseguradoras/{id}/
```

---

## Planes

**Endpoint Base:** `/api/planes/`

### Listar Planes
```
GET /api/planes/
```

### Obtener Un Plan
```
GET /api/planes/{id}/
```

### Crear Plan

```
POST /api/planes/
Content-Type: application/json
```

**Request Body Completo:**
```json
{
  "id_plan_aseguradora": "BCBS-GOLD-2024",
  "nombre": "Blue Cross Gold Plan 2024",
  "aseguradora": 1
}
```

**Notas sobre campos:**
- `id_plan_aseguradora` (requerido): ID del plan según la aseguradora
- `nombre` (requerido): Nombre del plan
- `aseguradora` (requerido): ID de la Aseguradora

### Actualizar Plan
```
PUT /api/planes/{id}/
PATCH /api/planes/{id}/
```

### Eliminar Plan
```
DELETE /api/planes/{id}/
```

---

## Pólizas

**Endpoint Base:** `/api/polizas/`

### Listar Pólizas
```
GET /api/polizas/
```

### Obtener Una Póliza
```
GET /api/polizas/{id}/
```

### Crear Póliza

```
POST /api/polizas/
Content-Type: application/json
```

**Request Body Completo (con todos los campos disponibles):**
```json
{
  "id_mercado": "MKT-2024-001234",
  "id_miembro": "MBR-2024-567890",
  "costo_poliza": "450.00",
  "subsidio": "150.00",
  "prima_mensual": "300.00",
  "total_ahorros": "1800.00",
  "plan_era": "Silver Plan 2023",
  "fecha_efectiva": "2024-02-01",
  "estado": 1,
  "fecha_envio": "2024-01-15",
  "fecha_cancelacion": null,
  "id_interno": "INT-001234",
  "es_duplicado": false,
  "ultimo_duplicado": null,
  "ffm_mercado": "FFM-12345",
  "npn_mercado": "87654321",
  "tipo_inscripcion": "NUEVA",
  "razon_inscripcion_especial": "Pérdida de cobertura laboral",
  "fecha_inscripcion_especial": "2024-01-10",
  "total_miembros": 3,
  "total_aplicantes": 2,
  "total_dependientes": 1,
  "direccion_fisica": 1,
  "direccion_postal": 2,
  "direccion_facturacion": 1,
  "agente": 1,
  "plan": 1,
  "colaboradores": [1, 2],
  "clientes_data": [
    {
      "cliente": 1,
      "es_solicitante_principal": true,
      "relacion": "Titular",
      "direccion_residencia": 1,
      "direccion_postal": 2
    },
    {
      "cliente": 2,
      "es_solicitante_principal": false,
      "relacion": "Cónyuge",
      "direccion_residencia": 1,
      "direccion_postal": 2
    },
    {
      "cliente": 3,
      "es_solicitante_principal": false,
      "relacion": "Hijo/a",
      "direccion_residencia": 1,
      "direccion_postal": 2
    }
  ]
}
```

**Notas sobre campos:**

**Campos Básicos:**
- `id_mercado` (requerido): ID del mercado
- `id_miembro` (requerido): ID del miembro
- `costo_poliza` (requerido): Costo total de la póliza
- `subsidio` (requerido): Subsidio aplicado
- `prima_mensual` (requerido): Prima mensual a pagar
- `total_ahorros`: Total de ahorros (default: 0)
- `plan_era`: El plan anterior (campo calculado, opcional)

**Fechas:**
- `fecha_efectiva` (requerido): Fecha de inicio de vigencia (YYYY-MM-DD)
- `fecha_envio` (requerido): Fecha de envío (YYYY-MM-DD)
- `fecha_cancelacion`: Fecha de cancelación (opcional)

**Referencias:**
- `estado`: ID del Estado de Póliza
- `agente`: ID del Agente responsable
- `plan` (requerido): ID del Plan

**IDs y Control:**
- `id_interno` (requerido): ID interno del sistema
- `es_duplicado`: Indica si es duplicado (default: false)
- `ultimo_duplicado`: ID del último duplicado (opcional)

**Información de Mercado:**
- `ffm_mercado`: FFM usado en mercado (opcional)
- `npn_mercado`: NPN usado en mercado (opcional)
- `tipo_inscripcion`: Tipo de inscripción ("NUEVA" o "RENOVACION")
- `razon_inscripcion_especial`: Razón de inscripción especial (opcional)
- `fecha_inscripcion_especial`: Fecha de inscripción especial (opcional)

**Totales:**
- `total_miembros`: Total de miembros (default: 0)
- `total_aplicantes`: Total de aplicantes (default: 0)
- `total_dependientes`: Total de dependientes (default: 0)

**Direcciones (IDs de Direcciones previamente creadas):**
- `direccion_fisica`: ID de dirección física
- `direccion_postal`: ID de dirección postal
- `direccion_facturacion`: ID de dirección de facturación

**Colaboradores:**
- `colaboradores`: Array de IDs de usuarios colaboradores

**Clientes (Estructura Anidada - clientes_data):**
Esta es la parte crítica para asociar clientes a la póliza:
```json
"clientes_data": [
  {
    "cliente": 1,                        // ID del Cliente
    "es_solicitante_principal": true,    // Si es el solicitante principal
    "relacion": "Titular",               // Relación con el titular
    "direccion_residencia": 1,           // ID de dirección de residencia (opcional)
    "direccion_postal": 2                // ID de dirección postal (opcional)
  }
]
```

**Valores comunes para `tipo_inscripcion`:**
- `NUEVA`: Nueva Venta
- `RENOVACION`: Renovación

**Valores comunes para `relacion`:**
- "Titular"
- "Cónyuge"
- "Hijo/a"
- "Padre/Madre"
- "Otro Dependiente"

### Actualizar Póliza
```
PUT /api/polizas/{id}/
PATCH /api/polizas/{id}/
```

**Request Body (ejemplo parcial - actualizar solo algunos campos):**
```json
{
  "prima_mensual": "325.00",
  "estado": 2,
  "total_miembros": 4,
  "clientes_data": [
    {
      "cliente": 1,
      "es_solicitante_principal": true,
      "relacion": "Titular",
      "direccion_residencia": 1,
      "direccion_postal": 2
    },
    {
      "cliente": 2,
      "es_solicitante_principal": false,
      "relacion": "Cónyuge",
      "direccion_residencia": 1,
      "direccion_postal": 2
    }
  ]
}
```

### Eliminar Póliza
```
DELETE /api/polizas/{id}/
```

---

## Notas

**Endpoint Base:** `/api/notas/`

Las notas se asocian a pólizas y permiten mencionar usuarios con @username.

### Listar Notas
```
GET /api/notas/
```

### Obtener Una Nota
```
GET /api/notas/{id}/
```

### Crear Nota

```
POST /api/notas/
Content-Type: application/json
```

**Request Body Completo:**
```json
{
  "poliza": 1,
  "contenido": "Cliente solicitó cambio de plan. @usuario1 por favor revisar opciones disponibles.",
  "archivo": null
}
```

**Con archivo adjunto (usar multipart/form-data):**
```
POST /api/notas/
Content-Type: multipart/form-data

poliza=1
contenido=Adjunto documento de solicitud. @usuario2 por favor procesar.
archivo=@/path/to/documento.pdf
```

**Notas sobre campos:**
- `poliza` (requerido): ID de la Póliza
- `contenido` (requerido): Contenido de la nota
- `archivo`: Archivo adjunto (opcional, usar multipart/form-data)
- `autor`: Se establece automáticamente con el usuario autenticado
- El sistema detecta menciones (@username) automáticamente

### Actualizar Nota
```
PUT /api/notas/{id}/
PATCH /api/notas/{id}/
```

### Eliminar Nota
```
DELETE /api/notas/{id}/
```

---

## Tareas

**Endpoint Base:** `/api/tareas/`

### Listar Tareas
```
GET /api/tareas/
```

### Obtener Una Tarea
```
GET /api/tareas/{id}/
```

### Crear Tarea

```
POST /api/tareas/
Content-Type: application/json
```

**Request Body Completo:**
```json
{
  "poliza": 1,
  "asignado_a": 2,
  "titulo": "Verificar documentación del cliente",
  "descripcion": "Revisar y validar todos los documentos de identificación y estatus migratorio antes del 15 de febrero.",
  "fecha_limite": "2024-02-15T17:00:00Z",
  "completada": false
}
```

**Notas sobre campos:**
- `poliza` (requerido): ID de la Póliza
- `asignado_a` (requerido): ID del Usuario asignado
- `titulo` (requerido): Título de la tarea
- `descripcion`: Descripción detallada (opcional)
- `fecha_limite`: Fecha y hora límite (formato ISO 8601, opcional)
- `completada`: Estado de completado (default: false)
- `creado_por`: Se establece automáticamente con el usuario autenticado

### Actualizar Tarea
```
PATCH /api/tareas/{id}/
```

**Request Body (marcar como completada):**
```json
{
  "completada": true
}
```

### Eliminar Tarea
```
DELETE /api/tareas/{id}/
```

---

## Citas

**Endpoint Base:** `/api/citas/`

### Listar Citas
```
GET /api/citas/
```

### Obtener Una Cita
```
GET /api/citas/{id}/
```

### Crear Cita

```
POST /api/citas/
Content-Type: application/json
```

**Request Body Completo:**
```json
{
  "poliza": 1,
  "cliente": 1,
  "fecha_hora": "2024-02-20T10:30:00Z",
  "proveedor": "Dr. Juan García",
  "lugar": "Centro Médico Los Angeles, 456 Health St, Los Angeles, CA 90001",
  "motivo": "Chequeo anual de rutina",
  "estado": "PROGRAMADA",
  "notas": "Paciente requiere ayuno de 8 horas antes de la cita.",
  "medico_asignado": 1
}
```

**Notas sobre campos:**
- `poliza` (requerido): ID de la Póliza
- `cliente`: ID del Cliente/Paciente (opcional)
- `fecha_hora` (requerido): Fecha y hora de la cita (formato ISO 8601)
- `proveedor` (requerido): Nombre del proveedor/doctor
- `lugar` (requerido): Lugar/dirección de la cita
- `motivo`: Motivo de la cita (opcional)
- `estado`: Estado de la cita (default: "PROGRAMADA")
- `notas`: Notas adicionales (opcional)
- `medico_asignado`: ID del Médico asignado (opcional)
- `creado_por`: Se establece automáticamente con el usuario autenticado

**Valores para `estado`:**
- `PROGRAMADA`: Programada
- `COMPLETADA`: Completada
- `CANCELADA`: Cancelada
- `NO_ASISTIO`: No Asistió

### Actualizar Cita
```
PATCH /api/citas/{id}/
```

**Request Body (ejemplo - cambiar estado):**
```json
{
  "estado": "COMPLETADA",
  "notas": "Cita completada exitosamente. Paciente en buen estado de salud."
}
```

### Eliminar Cita
```
DELETE /api/citas/{id}/
```

---

## Documentos

**Endpoint Base:** `/api/documentos/`

### Listar Documentos
```
GET /api/documentos/
```

### Obtener Un Documento
```
GET /api/documentos/{id}/
```

### Crear Documento

```
POST /api/documentos/
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
```
poliza=1
cliente=1
archivo=@/path/to/documento.pdf
titulo=Identificación - Licencia de Conducir
fecha_vencimiento=2028-06-15
categoria=IDENTIFICACION
etiquetas_ids=[1, 2, 3]
```

**Formato JSON equivalente (para referencia):**
```json
{
  "poliza": 1,
  "cliente": 1,
  "archivo": "archivo_binario",
  "titulo": "Identificación - Licencia de Conducir",
  "fecha_vencimiento": "2028-06-15",
  "categoria": "IDENTIFICACION",
  "etiquetas_ids": [1, 2, 3]
}
```

**Notas sobre campos:**
- `poliza` (requerido): ID de la Póliza
- `cliente`: ID del Cliente relacionado (opcional)
- `archivo` (requerido): Archivo a subir
- `titulo` (requerido): Título del documento
- `fecha_vencimiento`: Fecha de vencimiento (opcional, YYYY-MM-DD)
- `categoria`: Categoría del documento (default: "OTRO")
- `etiquetas_ids`: Array de IDs de etiquetas (opcional, write-only)
- `subido_por`: Se establece automáticamente con el usuario autenticado

**Valores para `categoria`:**
- `CARTA_MERCADO`: Carta de Mercado
- `ASEGURANZA`: Aseguranza
- `CITAS_MEDICAS`: Citas Médicas
- `BILLS`: Bills
- `IDENTIFICACION`: Identificación
- `ESTATUS_MIGRATORIO`: Estatus Migratorio
- `CONSENTIMIENTO`: Consentimiento
- `OTRO`: Otro

### Actualizar Documento
```
PATCH /api/documentos/{id}/
```

**Request Body:**
```json
{
  "titulo": "Identificación Actualizada",
  "fecha_vencimiento": "2029-06-15"
}
```

### Eliminar Documento
```
DELETE /api/documentos/{id}/
```

---

## Recordatorios

**Endpoint Base:** `/api/recordatorios/`

### Listar Recordatorios
```
GET /api/recordatorios/
```

### Obtener Un Recordatorio
```
GET /api/recordatorios/{id}/
```

### Crear Recordatorio

```
POST /api/recordatorios/
Content-Type: application/json
```

**Request Body Completo:**
```json
{
  "poliza": 1,
  "titulo": "Renovación de Póliza",
  "fecha_vencimiento": "2024-12-31",
  "hora_vencimiento": "09:00:00",
  "zona_horaria": "America/Los_Angeles",
  "establecer_recordatorio": true,
  "usuario_notificar": 2,
  "descripcion": "Contactar al cliente para renovación anual de póliza. Revisar cambios en cobertura y precios."
}
```

**Notas sobre campos:**
- `poliza` (requerido): ID de la Póliza
- `titulo` (requerido): Título del recordatorio
- `fecha_vencimiento` (requerido): Fecha de vencimiento (YYYY-MM-DD)
- `hora_vencimiento` (requerido): Hora de vencimiento (HH:MM:SS)
- `zona_horaria`: Zona horaria (default: "UTC")
- `establecer_recordatorio`: Si se debe establecer el recordatorio (default: true)
- `usuario_notificar` (requerido): ID del Usuario a notificar
- `descripcion`: Descripción o comentarios adicionales (opcional)

**Zonas horarias comunes:**
- `America/Los_Angeles`: Hora del Pacífico
- `America/Denver`: Hora de Montaña
- `America/Chicago`: Hora Central
- `America/New_York`: Hora del Este
- `UTC`: Tiempo Universal Coordinado

### Actualizar Recordatorio
```
PATCH /api/recordatorios/{id}/
```

**Request Body:**
```json
{
  "fecha_vencimiento": "2025-01-15",
  "descripcion": "Descripción actualizada del recordatorio."
}
```

### Eliminar Recordatorio
```
DELETE /api/recordatorios/{id}/
```

---

## Notificaciones

**Nota importante:** A diferencia de los recordatorios (que son creados manualmente por el usuario), las notificaciones se generan automáticamente por eventos del sistema (ej. login fallido, asignación a póliza, mención en nota).

**Endpoint Base:** `/api/notificaciones/` (Solo lista las del usuario autenticado)

### Listar Notificaciones
```
GET /api/notificaciones/
```

**Ejemplo de Respuesta:**
```json
[
  {
    "id": 15,
    "usuario": 2,
    "mensaje": "Has sido etiquetado en una nota de la póliza MKT-2024-001",
    "tipo": "TAG",
    "leida": false,
    "fecha_creacion": "2024-02-15T10:30:00Z",
    "content_type": 12, // ID interno del modelo (ej. Nota)
    "object_id": 45     // ID del objeto específico (ID de la Nota)
  },
  {
    "id": 14,
    "usuario": 2,
    "mensaje": "Se detectó un intento de inicio de sesión fallido en tu cuenta",
    "tipo": "SEGURIDAD",
    "leida": true,
    "fecha_creacion": "2024-02-14T08:15:00Z"
  }
]
```

### Marcar Una Notificación como Leída

```
POST /api/notificaciones/{id}/marcar_leida/
```

**Respuesta Esperada (200 OK):**
```json
{
  "status": "notificacion marcada como leida"
}
```

### Marcar TODAS las Notificaciones como Leídas

```
POST /api/notificaciones/marcar_todas_leidas/
```

**Respuesta Esperada (200 OK):**
```json
{
  "status": "todas marcadas como leidas"
}
```

**Tipos de Notificaciones (`tipo`):**
- `TAG`: Mención/etiquetado en nota o comentario.
- `ASIGNACION`: Asignado a póliza o recurso.
- `SEGURIDAD`: Alertas de seguridad (ej. login fallido).
- `SISTEMA`: Notificaciones generales del sistema.

---

## Recursos Adicionales

### Estados de Póliza
**Endpoint:** `/api/estados-poliza/`

Listar estados disponibles:
```
GET /api/estados-poliza/
```

### Etiquetas
**Endpoint:** `/api/etiquetas/`

Crear etiqueta:
```json
{
  "nombre": "Urgente",
  "color": "#FF0000"
}
```

### Médicos
**Endpoint:** `/api/medicos/`

Crear médico:
```json
{
  "nombre": "Dr. Juan García López",
  "hospital": "Centro Médico Los Angeles",
  "especializacion": "Medicina General"
}
```

---

## Notas Importantes

### Formatos de Fecha y Hora
- **Fecha:** `YYYY-MM-DD` (ej: `2024-02-15`)
- **Fecha y Hora:** ISO 8601 `YYYY-MM-DDTHH:MM:SSZ` (ej: `2024-02-15T14:30:00Z`)
- **Hora:** `HH:MM:SS` (ej: `14:30:00`)

### Paginación
Los endpoints de listado soportan paginación:
```
GET /api/polizas/?page=2
```

### Filtros
Muchos endpoints soportan filtros mediante query parameters:
```
GET /api/polizas/?estado=1
GET /api/clientes/?search=Rodriguez
GET /api/tareas/?completada=false
```

### Campos de Solo Lectura
Algunos campos son de solo lectura y se generan automáticamente:
- `id`: ID del registro
- `fecha_creacion`: Fecha de creación
- `ultima_actualizacion`: Última actualización
- `autor`, `creado_por`, `subido_por`: Usuario que realizó la acción

### Subida de Archivos
Para endpoints que requieren archivos (logos, documentos, avatares):
- Usar `Content-Type: multipart/form-data`
- En ThunderClient/Postman: seleccionar "Form" y tipo "File" para el campo
- Ejemplo: `archivo=@/path/to/file.pdf`

### Relaciones Many-to-Many
Para campos que aceptan múltiples IDs (colaboradores, etiquetas):
```json
{
  "colaboradores": [1, 2, 3],
  "etiquetas_ids": [1, 2]
}
```

---

## Ejemplos de Flujos Completos

### Flujo 1: Crear una Póliza Nueva Completa

**Paso 1:** Crear las direcciones necesarias
```json
POST /api/direcciones/
{
  "linea1": "123 Main St",
  "ciudad": "Los Angeles",
  "estado": "California",
  "zip_code": "90001",
  "condado": "Los Angeles County"
}
// Respuesta: {"id": 1, ...}
```

**Paso 2:** Crear o verificar que existan los clientes
```json
POST /api/clientes/
{
  "primer_nombre": "Carlos",
  "apellido_paterno": "Rodríguez",
  "genero": "Masculino",
  "fecha_nacimiento": "1985-06-15",
  "ssn": "123-45-6789",
  "email": "carlos@email.com",
  "telefono": "+1-555-234-5678",
  "ingreso_anual": "45000.00",
  "estado_civil": "Casado",
  "pais_nacimiento": "México",
  "estado_inmigracion": "Residente Permanente"
}
// Respuesta: {"id": 1, ...}
```

**Paso 3:** Crear la póliza con todos los datos
```json
POST /api/polizas/
{
  "id_mercado": "MKT-2024-001234",
  "id_miembro": "MBR-2024-567890",
  "costo_poliza": "450.00",
  "subsidio": "150.00",
  "prima_mensual": "300.00",
  "fecha_efectiva": "2024-02-01",
  "estado": 1,
  "fecha_envio": "2024-01-15",
  "id_interno": "INT-001234",
  "total_miembros": 1,
  "total_aplicantes": 1,
  "total_dependientes": 0,
  "direccion_fisica": 1,
  "direccion_postal": 1,
  "direccion_facturacion": 1,
  "agente": 1,
  "plan": 1,
  "clientes_data": [
    {
      "cliente": 1,
      "es_solicitante_principal": true,
      "relacion": "Titular",
      "direccion_residencia": 1,
      "direccion_postal": 1
    }
  ]
}
```

### Flujo 2: Agregar Documentos a una Póliza

```
POST /api/documentos/
Content-Type: multipart/form-data

poliza=1
cliente=1
archivo=@/path/to/licencia.pdf
titulo=Licencia de Conducir
categoria=IDENTIFICACION
fecha_vencimiento=2028-06-15
```

### Flujo 3: Crear Tarea y Nota para Seguimiento

**Crear Tarea:**
```json
POST /api/tareas/
{
  "poliza": 1,
  "asignado_a": 2,
  "titulo": "Revisar documentación",
  "descripcion": "Validar documentos subidos",
  "fecha_limite": "2024-02-15T17:00:00Z"
}
```

**Crear Nota:**
```json
POST /api/notas/
{
  "poliza": 1,
  "contenido": "Documentación recibida. @usuario2 favor de revisar antes del viernes."
}
```

---

## Códigos de Respuesta HTTP

- `200 OK`: Solicitud exitosa (GET, PUT, PATCH)
- `201 Created`: Recurso creado exitosamente (POST)
- `204 No Content`: Eliminación exitosa (DELETE)
- `400 Bad Request`: Error en los datos enviados
- `401 Unauthorized`: No autenticado (falta token o es inválido)
- `403 Forbidden`: No tiene permisos para esta acción
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

---

**Última actualización:** Enero 2024

Para más información o soporte, contactar al equipo de desarrollo.
