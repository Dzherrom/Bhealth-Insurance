import os

file_path = "API_CRUD_DETAILED.md"

content_to_append = """
## Reportes Adicionales

**Endpoints:**
- `GET /api/reportes/agentes-facturacion/` - Reporte de facturación de agentes.
- `GET /api/reportes/intentos-fallidos/` - Reporte de intentos fallidos de login.

"""

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

split_marker = "---"
parts = content.rsplit(split_marker, 1)

if len(parts) == 2:
    new_content = parts[0] + content_to_append + "\n---\n" + parts[1]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully appended additional reports.")
else:
    print("Could not find split marker.")
