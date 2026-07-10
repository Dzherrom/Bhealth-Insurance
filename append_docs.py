import os

file_path = "API_CRUD_DETAILED.md"

content_to_append = """
## Usuarios (User Management)

**Endpoint Base:** `/api/users/`

### Listar Usuarios
```
GET /api/users/
```
Soporta paginación (`page`, `page_size`), búsqueda (`search`) y filtros (`is_active`, `profile__status`, `profile__role`, `empleados=1`).

### Obtener Un Usuario
```
GET /api/users/{id}/
```

### Crear Usuario
```
POST /api/users/
```

### Actualizar Usuario
```
PUT /api/users/{id}/
PATCH /api/users/{id}/
```

### Eliminar Usuario
```
DELETE /api/users/{id}/
```

### Subir Avatar
```
POST /api/users/{id}/avatar/
```

### Resetear Contraseña
```
POST /api/users/{id}/reset-password/
```

### Activar / Desactivar Usuario
```
POST /api/users/{id}/activate/
POST /api/users/{id}/deactivate/
```

---

## Historial de Póliza

**Endpoint Base:** `/api/historial/`

### Listar Historial de una Póliza
```
GET /api/historial/?poliza={poliza_id}
```

---

## Carpetas de Documentos

**Endpoint Base:** `/api/carpetas-documentos/`

### Listar Carpetas
```
GET /api/carpetas-documentos/
```

### Crear Carpeta
```
POST /api/carpetas-documentos/
```

---

## Cambios de Vida

**Endpoint Base:** `/api/cambios-de-vida/`

### Listar Cambios de Vida
```
GET /api/cambios-de-vida/
```

### Crear Cambio de Vida
```
POST /api/cambios-de-vida/
```

---

## Ingresos del Empleador

**Endpoint Base:** `/api/ingresos-empleador/`

### Listar Ingresos
```
GET /api/ingresos-empleador/
```

### Crear Ingreso
```
POST /api/ingresos-empleador/
```

---

## Documentos Legales del Cliente

**Endpoint Base:** `/api/documentos-legales/`

### Listar Documentos Legales
```
GET /api/documentos-legales/
```

### Crear Documento Legal
```
POST /api/documentos-legales/
```

---

## Médicos y Medicamentos

**Endpoint Base Médicos:** `/api/medicos-poliza/`
**Endpoint Base Medicamentos:** `/api/medicamentos/`

### Listar Médicos de Póliza
```
GET /api/medicos-poliza/?poliza={poliza_id}
```

### Crear Médico de Póliza
```
POST /api/medicos-poliza/
```

### Listar Medicamentos de Póliza
```
GET /api/medicamentos/?poliza={poliza_id}
```

### Crear Medicamento
```
POST /api/medicamentos/
```

---

## Comisiones y Reportes

**Endpoint Base Reportes:** `/api/reportes_comision/`
**Endpoint Base Configuración:** `/api/configuracion-comisiones/`

### Listar Reportes de Comisión
```
GET /api/reportes_comision/
```

### Listar Configuración de Comisiones
```
GET /api/configuracion-comisiones/
```

---

## Cuentas Bancarias e Información de Pago

**Endpoint Base Cuentas Bancarias:** `/api/cuentas_bancarias/`
**Endpoint Base Info Pago:** `/api/info_pago/`

### Listar Cuentas Bancarias
```
GET /api/cuentas_bancarias/?poliza={poliza_id}
```

### Crear Cuenta Bancaria
```
POST /api/cuentas_bancarias/
```

### Listar Info de Pago
```
GET /api/info_pago/?poliza={poliza_id}
```

### Crear Info de Pago
```
POST /api/info_pago/
```

---

## Departamentos

**Endpoint Base:** `/api/departamentos/`

### Listar Departamentos
```
GET /api/departamentos/
```

---

## Solicitudes de Consentimiento (Consent Requests)

**Endpoint Base:** `/api/consent-requests/`

### Listar Solicitudes
```
GET /api/consent-requests/
```

### Crear Solicitud
```
POST /api/consent-requests/
```

---

## Tipos de Producto

**Endpoint Base:** `/api/tipos-producto/`

### Listar Tipos de Producto
```
GET /api/tipos-producto/
```

---

## Utilidades de Código Postal

**Endpoint:** `/api/utils/zipcode/{zip_code}/`

### Consultar Código Postal
```
GET /api/utils/zipcode/33101/
```
**Respuesta:**
```json
{
  "zip_code": "33101",
  "city": "Miami",
  "state_abbr": "FL",
  "counties": ["Miami-Dade"]
}
```

---

## Portal Cliente

**Endpoints:**
- `POST /api/register/cliente/` - Registro de cliente.
- `GET /api/portal-cliente/dashboard/` - Dashboard del cliente.
- `POST /api/portal-cliente/solicitar-cambio/` - Solicitar cambio en la póliza.
- `POST /api/portal-cliente/solicitar-documento/` - Solicitar documento.

---

## Importación y Exportación Flat (Pólizas)

**Endpoints:**
- `POST /api/polizas/flat/preview/` - Previsualizar importación flat.
- `POST /api/polizas/flat/import/` - Importar póliza flat.
- `POST /api/polizas/flat/import/batch/` - Importación masiva flat.
- `GET /api/polizas/flat/export/` - Exportar pólizas flat.

---

## Calendario de Primas

**Endpoint:** `/api/polizas/{poliza_id}/calendario-primas/`

### Obtener Calendario
```
GET /api/polizas/1/calendario-primas/
```
"""

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Insert before the "Última actualización" line
split_marker = "---"
parts = content.rsplit(split_marker, 1)

if len(parts) == 2:
    new_content = parts[0] + content_to_append + "\n---\n" + parts[1]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully appended endpoints.")
else:
    print("Could not find split marker.")
