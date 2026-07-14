# Guía del Empleado — Lumina CRM (BHealth Insurance)

Manual completo para el equipo que usa el sistema día a día. Está escrito en lenguaje sencillo, **sin términos de programación**. Si eres agente, asistente, coordinador, sherpa o cualquier rol operativo, esta guía te explica **qué es el sistema, para qué sirve cada pantalla y cómo hacer tu trabajo** dentro de él.

---

## Tabla de Contenidos

1. [¿Qué es Lumina CRM?](#qué-es-lumina-crm)
2. [¿Cómo entro al sistema?](#cómo-entro-al-sistema)
3. [La pantalla principal: menú y cabecera](#la-pantalla-principal-menú-y-cabecera)
4. [Dashboard: el tablero de control](#dashboard-el-tablero-de-control)
5. [Usuarios del sistema](#usuarios-del-sistema)
6. [Pólizas: el corazón del trabajo](#pólizas-el-corazón-del-trabajo)
7. [Cotizaciones: antes de que la póliza sea oficial](#cotizaciones-antes-de-que-la-póliza-sea-oficial)
8. [Crear una nueva póliza o cotización](#crear-una-nueva-póliza-o-cotización)
9. [Detalle de una póliza: todas las secciones](#detalle-de-una-póliza-todas-las-secciones)
10. [El recorrido de una póliza entre departamentos](#el-recorrido-de-una-póliza-entre-departamentos)
11. [Citas médicas](#citas-médicas)
12. [Formularios de firmas](#formularios-de-firmas)
13. [Configuración de la agencia](#configuración-de-la-agencia)
14. [Enlaces rápidos a HealthCare.gov](#enlaces-rápidos-a-healthcaregov)
15. [El portal del cliente (lo que ve tu cliente)](#el-portal-del-cliente-lo-que-ve-tu-cliente)
16. [Notificaciones y recordatorios](#notificaciones-y-recordatorios)
17. [Quién puede hacer qué (roles simplificados)](#quién-puede-hacer-qué-roles-simplificados)
18. [Modo claro / oscuro e idioma](#modo-claro--oscuro-e-idioma)
19. [Tareas frecuentes: guía rápida](#tareas-frecuentes-guía-rápida)
20. [Preguntas frecuentes](#preguntas-frecuentes)
21. [Glosario en palabras simples](#glosario-en-palabras-simples)

---

## ¿Qué es Lumina CRM?

**Lumina CRM** (también conocido como BHealth Insurance en el proyecto) es el **sistema interno de tu agencia de seguros de salud**. Piensa en él como una oficina digital donde tu equipo puede:

- Registrar clientes y sus familias
- Crear y dar seguimiento a **pólizas de seguro** (Medicare, ACA, dental, vida, etc.)
- Guardar documentos, notas y pagos en un solo lugar
- Coordinar el trabajo entre departamentos (comercial, sherpa, cobranza, etc.)
- Ver estadísticas del negocio en un tablero
- Permitir que el **cliente final** consulte sus pólizas y pida cambios desde su propio portal

**No necesitas instalar nada.** Solo abres el navegador (Chrome, Edge, Firefox), entras a la dirección que te dio tu coordinador e inicias sesión con tu usuario y contraseña.

---

## ¿Cómo entro al sistema?

### Dirección de acceso (empleados)

Tu coordinador te dará una dirección similar a:

```
http://TU-SERVIDOR/auth/login
```

En producción puede ser la IP de la agencia o un dominio como `https://tu-agencia.com/auth/login`.

### Credenciales

- **Usuario:** el que te asignó administración (ejemplo: `maria.garcia` o `lumina-admin`)
- **Contraseña:** la que elegiste o te entregaron al crear tu cuenta

### Pasos para entrar

1. Abre la dirección en el navegador
2. Escribe tu usuario y contraseña
3. Pulsa **Iniciar sesión**
4. El sistema te lleva automáticamente al **Dashboard**

### Si no puedes entrar

| Problema | Qué hacer |
|----------|-----------|
| "Credenciales incorrectas" | Verifica mayúsculas y que no tengas espacios extra. Pide reset a tu coordinador |
| La página no carga | Verifica internet. Si persiste, avisa a soporte técnico |
| Te manda al portal de clientes | Estás usando la entrada de clientes (`/client`). Los empleados deben usar `/auth/login` |
| Sesión cerrada sola | Vuelve a iniciar sesión. Si pasa muy seguido, reporta a TI |

### Cerrar sesión

En la esquina superior derecha hay un menú con la opción **Cerrar sesión**. Úsala siempre que termines en un equipo compartido.

---

## La pantalla principal: menú y cabecera

Una vez dentro, verás dos zonas fijas:

### Menú lateral izquierdo

Es tu **mapa de navegación**. Tiene grupos:

| Grupo | Opciones |
|-------|----------|
| **Principal** | Dashboard, Usuarios |
| **Operaciones** | Citas, Pólizas, Cotizaciones |
| **Documentos** | Formularios (firmas) |
| **Sistema** | Configuración |

Puedes **ocultar el menú** con la flecha pequeña en el borde para ganar espacio.

Abajo del menú aparece tu **nombre** y las iniciales de tu perfil.

### Barra superior (cabecera)

En la parte de arriba encontrarás:

- El título **"CRM - BHealth Insurance"**
- Botones de acción rápida (crear cliente, enlaces externos, etc.)
- Selector de **idioma** (ES / EN) — guarda preferencia pero la interfaz está mayormente en español
- Botón de **modo claro/oscuro** (sol / luna)
- Icono de **notificaciones**
- Menú de **usuario** (perfil, cerrar sesión)

---

## Dashboard: el tablero de control

El **Dashboard** es la primera pantalla al entrar. Es como el **tablero del director de una oficina**: te muestra de un vistazo cómo va el negocio.

### Cajas de números importantes (KPIs)

En la parte superior verás tarjetas con cifras como:

| Tarjeta | Qué significa |
|---------|---------------|
| **Total de pólizas** | Cuántas pólizas activas hay registradas en el sistema |
| **Total de aplicantes** | Personas cubiertas (titular + familia) en esas pólizas |
| **Ventas totales** | Suma de primas mensuales de todas las pólizas |
| **Tasa de retención** | Porcentaje de pólizas que siguen activas vs. canceladas |
| **Recordatorios pendientes** | Tareas o avisos que aún no se han atendido |
| **Cumpleaños esta semana** | Clientes que cumplen años — útil para contacto proactivo |
| **Nuevos prospectos** | Clientes o leads recientes |

### Filtro por fechas

Puedes elegir un **rango de fechas** para ver estadísticas de un periodo específico, o pulsar **"Ver todo"** para ver el historial completo sin filtro.

### Gráficos

- **Gráfico de barras / líneas:** pólizas y aplicantes por mes
- **Gráfico circular (pastel):** distribución por tipo de producto (Medicare, ACA, etc.)
- **Ranking de agentes:** quién tiene más pólizas y aplicantes
- **Mapa de Estados Unidos:** en qué estados están concentradas las pólizas
- **Desglose por aseguradora:** qué compañías de seguro predominan

### ¿Para qué sirve en el día a día?

- El **coordinador** revisa rendimiento del equipo
- El **agente** ve su posición relativa en el ranking
- **Recepción y soporte** identifican volumen de trabajo y tendencias
- Todos pueden detectar si bajó la retención o subieron las cancelaciones

---

## Usuarios del sistema

**Menú → Usuarios** (`/crm/users`)

Aquí se administran las **cuentas de empleados** que pueden entrar al CRM.

> **Nota:** Solo lo ven quienes tienen permiso de administración o coordinación (Super Admin, LED/Manager).

### ¿Qué puedes hacer aquí?

- Ver lista de empleados con su rol y departamento
- Crear nuevos usuarios para el equipo
- Editar datos: nombre, correo, rol, departamento, agente vinculado
- Activar o desactivar cuentas
- Asignar foto de perfil (avatar)
- Restablecer contraseña

### Conceptos importantes

- **Rol:** define qué puede hacer la persona en el sistema (ver sección [Roles](#quién-puede-hacer-qué-roles-simplificados))
- **Departamento:** área operativa (Comercial, Sherpa, Cobranza, etc.)
- **Agente vinculado:** si el usuario es un agente de seguros, se conecta su cuenta con su ficha de agente (NPN, FFM)

---

## Pólizas: el corazón del trabajo

**Menú → Pólizas** (`/crm/polizas`)

Aquí está el **listado de pólizas oficiales** — seguros que ya pasaron la etapa de cotización y están activas, en proceso o canceladas.

### ¿Qué NO aparece aquí?

Las **cotizaciones** (borradores iniciales con estado QUOTE) **no** se listan en Pólizas. Esas viven en el menú **Cotizaciones**.

### La tabla de pólizas

Cada fila representa una póliza con información resumida:

- ID de mercado
- Nombre del cliente principal
- Agente asignado
- Estado (activa, cancelada, etc.)
- Prima mensual
- Fecha efectiva

### Filtros y búsqueda

Puedes filtrar por:

- Estado de la póliza
- Agente
- Fechas
- Texto libre (nombre, ID de mercado)
- Ver archivadas (pólizas guardadas en el archivo, no eliminadas)

### Acciones sobre una póliza

Desde la lista puedes:

- **Abrir** el detalle completo
- **Editar** (si tienes permiso)
- **Copiar** datos para crear una similar
- **Archivar** (solo coordinadores/admin — la póliza desaparece del listado normal pero no se borra)

### Botón "Nueva póliza"

Abre el **asistente paso a paso** para registrar una nueva cotización o póliza (ver [Crear una nueva póliza](#crear-una-nueva-póliza-o-cotización)).

---

## Cotizaciones: antes de que la póliza sea oficial

**Menú → Cotizaciones** (`/crm/cotizaciones`)

Las **cotizaciones** son pólizas en estado **QUOTE** (borrador / cotización). Representan el trabajo **en preparación** antes de enviarlas al mercado de seguros.

### Analogía simple

Imagina que una **cotización** es un expediente en la bandeja de "Por completar" y una **póliza** en la bandeja de "En vigor".

### Flujo típico

1. El asistente comercial crea la cotización con datos del cliente
2. Completa información en el detalle (plan, cobertura, documentos)
3. Valida que todo esté correcto
4. **Envía** la cotización → pasa a póliza activa y sale de Cotizaciones

---

## Crear una nueva póliza o cotización

**Menú → Pólizas → Nueva póliza** o botón equivalente en la lista.

El sistema te guía en **pasos** (como un formulario por etapas):

### Paso 1 — Información de la póliza

| Campo | Qué poner |
|-------|-----------|
| **Tipo de producto** | Medicare, Medicaid, ACA (Health Insurance), dental, vida, etc. |
| **Fecha de efectividad** | Cuándo empieza la cobertura (por defecto: primer día del mes siguiente) |
| **Agente registrado** | El agente de seguros responsable de este cliente |

> En este paso **no** se elige el plan detallado todavía — eso se completa después en el detalle de la póliza.

### Paso 2 — Información personal

Datos del **titular** (persona principal):

- Nombre completo, fecha de nacimiento, sexo
- Teléfono, correo electrónico
- Idioma preferido
- Si usa tabaco, peso, estatura
- Ingreso anual del hogar

**Dos modos:**

- **Cliente nuevo:** llenas todo manualmente
- **Cliente existente:** buscas en el catálogo y el sistema trae sus datos guardados

El sistema **verifica duplicados** (mismo correo o SSN) para no crear clientes repetidos.

### Paso 3 — Grupo familiar

Agrega:

- **Cónyuge** (opcional)
- **Dependientes** (hijos u otros familiares)

Para cada persona: nombre, parentesco, fecha de nacimiento, si es aplicante al seguro, etc.

### Paso 4 — Dirección

La **dirección física es obligatoria**. Es donde vive el titular.

Al escribir el **código postal (ZIP)**, el sistema busca automáticamente:

- Ciudad
- Estado
- **Condado** (muy importante para seguros ACA/Marketplace)

### Al terminar

- Se crea una **cotización** (estado QUOTE)
- Aparece en **Cotizaciones**
- Puedes abrirla para completar plan, pagos, documentos y luego **enviarla**

---

## Detalle de una póliza: todas las secciones

Al hacer clic en una póliza entras a su **expediente digital completo**. Es la pantalla donde pasas la mayor parte del tiempo.

### Resumen superior

Muestra de un vistazo:

- ID de mercado y ID de miembro
- Cliente principal
- Agente asignado y agente de registro
- Nombre del plan y aseguradora
- Estado de la póliza, estado de documentos, estado de pago
- Prima mensual y fecha efectiva

Desde aquí puedes cambiar **estatus** y **agente asignado** (según tu rol).

### Menú de secciones del expediente

El detalle se organiza en pestañas o secciones. Las principales:

---

### 1. Información de la póliza / Plan

Aquí completas la **cobertura real** del seguro:

**Información de cobertura:**
- Tipo de producto
- Aseguradora
- Nombre del plan
- Fecha de efectividad y fecha de cancelación (si aplica)
- Metal (Bronce, Plata, Oro, Platino — en ACA)
- ID del mercado, ID de miembro, ID del plan CMS
- Costo de la póliza, crédito fiscal/subsidio, prima mensual

**Información de la póliza:**
- Tipo de venta
- FFM usado en el mercado
- NPN usado en el mercado
- Fecha de inscripción en periodo especial
- Razón de inscripción en periodo especial
- **Detalles de póliza** (campo libre para notas internas)

---

### 2. Miembros de la familia

Lista de **todas las personas** en la póliza: titular, cónyuge, dependientes.

Para cada miembro puedes:

- Ver datos personales (nombre, fecha nacimiento, contacto)
- Ver si es **aplicante** (cubierto por el seguro) o solo dependiente
- Ver y editar **ingresos** (empleador, salario anual/mensual)
- Ver **estatus migratorio** y documentos legales (pasaporte, green card, etc.)
- Agregar nuevos miembros
- Enviar SMS o correo (enlaces preparados)

Al expandir un miembro ves tablas de ingresos y documentos legales.

---

### 3. Direcciones

Tres tipos de dirección (pueden ser la misma o diferentes):

| Tipo | Uso |
|------|-----|
| **Física** | Domicilio real (obligatoria al crear) |
| **Postal** | Donde llega el correo |
| **Facturación** | Para pagos y facturas |

---

### 4. Información de pago

- ¿Pago recurrente automático?
- Día de pago mensual
- **Estado de pago:** Pendiente, Pago automático, Fallido, Pagado, No aplicable
- **Tarjetas de crédito** registradas (datos sensibles — solo roles autorizados ven números completos)
- **Cuentas bancarias** (ACH)
- **Calendario de primas:** vista de los 12 meses con qué pagos están pendientes, vencidos o próximos

---

### 5. Documentos

Archivo digital de la póliza, organizado en **carpetas**:

- Carta de mercado
- Documentos de aseguradora
- Consentimientos firmados
- Identificación
- Otros

Cada documento tiene:

- **Estado:** Pendiente, Procesado, Rechazado, Completado, Expirado
- **Etiquetas** para clasificar
- Fecha de vencimiento (si aplica)
- Vista previa y descarga (según permisos)

Puedes **subir archivos** (PDF, imágenes) y **descargar todo** en un ZIP.

---

### 6. Notas

Chat interno del equipo sobre esta póliza:

- Escribe comentarios visibles para colegas
- Menciona a otros usuarios con @ para notificarles
- Adjunta archivos a las notas
- La **última nota** aparece destacada en el resumen

---

### 7. Recordatorios

Alarmas y tareas con fecha:

- "Llamar al cliente el viernes"
- "Renovación en 30 días"
- Pueden ser **privados** (solo tú) o visibles para el equipo

---

### 8. Eventos de vida (Cambios de vida)

Cuando el cliente tiene un **cambio importante** que afecta su seguro:

| Tipo de evento | Ejemplo |
|----------------|---------|
| Nueva dirección | Se mudó de estado o condado |
| Cambio en ingresos | Nuevo trabajo o pérdida de empleo |
| Cambio migratorio | Obtuvo residencia o ciudadanía |
| Nuevo miembro | Nació un bebé, se casó |
| Embarazo | Nueva cobertura materna |
| Fallecido | Retirar a un miembro del plan |
| Otros | Cualquier situación especial |

**Estados del evento:**

- **Pendiente** — registrado, falta trabajar
- **En proceso** — alguien del equipo lo está gestionando
- **Realizado** — ya se aplicó en el mercado
- **Cancelado** — ya no procede

El sistema guarda un **historial** con comparación de datos antes y después.

> Los clientes también pueden solicitar cambios desde su **portal**; esas solicitudes aparecen aquí para que el equipo las procese.

---

### 9. Médico principal y medicamentos

- **Médico principal (PCP):** nombre, hospital, especialidad
- **Medicamentos:** nombre, dosis, duración, fechas

Útil para planes que requieren documentar red médica y recetas.

---

### 10. Historial y actividad

Registro automático de **todo lo que pasó** en la póliza:

- "Documento subido"
- "Nota agregada"
- "Estado cambiado"
- "Pase a manager"
- Quién lo hizo y cuándo

Es la **bitácora** del expediente — no se puede falsificar ni borrar fácilmente.

---

### 11. Presencia y bloqueo de edición

Si otro compañero está **editando** la misma póliza al mismo tiempo, verás un aviso. Solo **una persona** puede editar a la vez para evitar que dos personas sobrescriban cambios.

- Modo **ver** — solo lectura
- Modo **editar** — puedes cambiar datos

Si intentas editar y alguien más ya lo tiene, el sistema te pedirá esperar.

---

## El recorrido de una póliza entre departamentos

Muchas agencias trabajan en **cadena**: una persona captura, otra revisa, otra inscribe en el marketplace. El sistema refleja eso con **etapas de flujo**:

```
┌─────────────────────┐
│  CAPTURA ASISTENTE  │  ← El asistente comercial llena el expediente
└──────────┬──────────┘
           │  "Pase a Manager"
           ▼
┌─────────────────────┐
│  REVISIÓN MANAGER   │  ← El coordinador revisa que todo esté correcto
└──────────┬──────────┘
           │  "Pase a Sherpa"
           ▼
┌─────────────────────┐
│  EN PROCESO SHERPA  │  ← El sherpa inscribe en HealthCare.gov / marketplace
└──────────┬──────────┘
           │  "Cerrar en Sherpa"  o  "Devolver a Asistente"
           ▼
┌─────────────────────┐
│ COMPLETADA SHERPA   │  ← Inscripción terminada
└─────────────────────┘
```

### Acciones del flujo (botones en el detalle)

| Botón | Quién lo usa | Qué hace |
|-------|--------------|----------|
| **Pase a Manager** | Asistente comercial | Envía el expediente a revisión |
| **Pase a Sherpa** | Coordinador | Autoriza que sherpa trabaje en marketplace |
| **Devolver a Asistente** | Sherpa / coordinador | Regresa con nota explicando qué falta |
| **Cerrar en Sherpa** | Sherpa | Marca inscripción completada |

### Enviar cotización al mercado

Cuando la cotización está lista:

1. Abre el detalle en **Cotizaciones**
2. Completa plan, documentos y pagos
3. Usa **Validar envío** — el sistema revisa que no falte nada crítico
4. Pulsa **Enviar** — la cotización se convierte en póliza activa

---

## Citas médicas

**Menú → Citas** (`/crm/citas`)

Agenda de **citas médicas** vinculadas a clientes y pólizas:

- Fecha y hora
- Proveedor / médico
- Lugar
- Estado: confirmada, realizada, cancelada

Útil para el departamento de **Gestión y Resolución** que coordina servicios post-venta.

---

## Formularios de firmas

**Menú → Formularios** (`/crm/formularios-de-firmas`)

Gestión de **consentimientos y firmas electrónicas**:

- Crear solicitud de firma para un cliente
- Enviar al proveedor de firma digital
- Ver estado: pendiente, firmado, rechazado
- El documento firmado se guarda automáticamente en la póliza

---

## Configuración de la agencia

**Menú → Configuración** (`/crm/configuraciones`)

Área de **ajustes generales** (normalmente la usan coordinadores y administradores):

| Sección | Para qué sirve |
|---------|----------------|
| **Agencia** | Nombre legal, teléfono, logos, título del portal cliente, pie de correos |
| **Status** | Estados de póliza personalizados (colores, nombres) |
| **Notificaciones** | Plantillas de correos (contratos, pagos, renovaciones) |
| **Listado** | Configuración de listados generales |
| **Etiquetas de documento** | Etiquetas para clasificar archivos |
| **Usuarios facturados** | Usuarios que cuentan para facturación |
| **Importar / Exportar pólizas** | Carga masiva desde Excel o exportación |

---

## Enlaces rápidos a HealthCare.gov

En la **cabecera del CRM** hay un botón con acceso a recursos del **Marketplace federal**:

| Enlace | Utilidad |
|--------|----------|
| Iniciar sesión | Entrar a HealthCare.gov |
| Página de inicio | Sitio principal |
| Para agentes y corredores | Recursos oficiales para agentes |
| Recursos CMS | Herramientas y capacitación CMS |
| Información fiscal / 1095-A | Temporada de impuestos |
| ¿Cómo pagar tu prima? | Ayuda al cliente con pagos |

Son **atajos** para no tener que buscar manualmente en el navegador durante una llamada con el cliente.

---

## El portal del cliente (lo que ve tu cliente)

Tus clientes tienen su **propia entrada**, separada del CRM:

```
http://TU-SERVIDOR/client
```

### ¿Qué pueden hacer los clientes?

- Iniciar sesión con su usuario y contraseña
- Ver **sus pólizas** y datos personales
- Ver el **grupo familiar** en cada póliza
- **Solicitar cambios** (dirección, ingresos, teléfono, etc.)
- **Subir documentos** que te pidan
- Editar o cancelar solicitudes **pendientes**

### ¿Qué NO pueden hacer?

- Ver otras pólizas de otros clientes
- Entrar al CRM de empleados
- Ver datos sensibles de otros miembros sin permiso
- Cambiar el plan directamente (solo solicitan; tú procesas)

### Tu trabajo cuando el cliente solicita algo

1. El cliente envía solicitud desde su portal
2. Aparece en el expediente de la póliza (eventos de vida / cambios pendientes)
3. Tú revisas, procesas en el marketplace si aplica
4. Marcas el evento como **Realizado**

---

## Notificaciones y recordatorios

### Campana de notificaciones

En la cabecera, el icono de **campana** muestra avisos:

- Te mencionaron en una nota
- Se te asignó como colaborador en una póliza
- Nuevo cambio de vida en una póliza tuya
- Mensajes generales del coordinador

Puedes marcar como leídas una por una o **todas a la vez**.

### Recordatorios en la póliza

Son **tareas con fecha** dentro de cada expediente. El dashboard también cuenta cuántos recordatorios globales están pendientes.

---

## Quién puede hacer qué (roles simplificados)

No todos ven ni editan lo mismo. Tu coordinador te asignó un **rol**:

| Rol (nombre en sistema) | En palabras simples |
|-------------------------|---------------------|
| **Super Admin** | Dueño del sistema. Ve y configura todo |
| **LED / Coordinador** | Jefe de departamento. Ve todas las pólizas, archiva, asigna trabajo |
| **Client Support / Asistente** | Captura clientes nuevos. Ve su propia cartera. No ve números de tarjeta ni SSN completos |
| **Health Sherpa** | Inscribe en marketplace. Ve pólizas de su NPN. Maneja documentos gubernamentales |
| **Agente** | Similar a sherpa en visibilidad por NPN. Ventas telefónicas |
| **Cobranza** | Solo estados de pago y comprobantes. No toca datos personales |
| **Gestión y Resolución** | Citas y postventa. No modifica la cuenta del cliente |
| **Recuperación** | Reactiva pólizas canceladas o en riesgo |
| **Recepción** | Canaliza llamadas. Visibilidad amplia de consulta |
| **Soporte al Cliente** | Retención y seguimiento proactivo |

Si intentas hacer algo que tu rol no permite, el botón simplemente **no aparece** o el sistema muestra un mensaje de permiso denegado.

---

## Modo claro / oscuro e idioma

### Modo claro y oscuro

- Botón **sol / luna** en la cabecera
- **Claro:** fondo blanco, ideal con mucha luz
- **Oscuro:** fondo oscuro, más cómodo de noche o para pantallas prolongadas
- Tu elección se **recuerda** la próxima vez que entres

### Idioma ES / EN

El botón **ES / EN** guarda tu preferencia. La interfaz está principalmente en **español**; el selector prepara el sistema para futuras traducciones.

---

## Tareas frecuentes: guía rápida

| Quiero… | Dónde voy | Qué hago |
|---------|-----------|----------|
| Ver cómo va el negocio | Dashboard | Revisar tarjetas y gráficos |
| Registrar un cliente nuevo | Pólizas → Nueva póliza | Paso 2, modo "cliente nuevo" |
| Crear una cotización | Pólizas → Nueva póliza | Completar los 4 pasos del asistente |
| Completar plan y costos | Cotizaciones → abrir → Plan | Llenar cobertura y guardar |
| Enviar al mercado | Cotizaciones → detalle | Validar envío → Enviar |
| Agregar un hijo al plan | Póliza → Miembros familia | Agregar miembro |
| Subir carta de mercado | Póliza → Documentos | Elegir carpeta → Subir archivo |
| Dejar nota al equipo | Póliza → Notas | Escribir y @mencionar colega |
| Registrar cambio de dirección | Póliza → Eventos de vida | Tipo "Nueva dirección" |
| Pasar expediente a sherpa | Póliza → Flujo | Pase a Manager → (manager) Pase a Sherpa |
| Ver solicitud del cliente | Póliza → Eventos de vida | Filtrar pendientes |
| Agendar cita médica | Citas | Nueva cita, vincular póliza |
| Crear usuario nuevo | Usuarios | Solo admin/coordinador |
| Ir a HealthCare.gov | Cabecera → enlaces | Elegir enlace necesario |
| Cerrar sesión | Cabecera → usuario | Cerrar sesión |

---

## Preguntas frecuentes

### ¿Puedo borrar una póliza?

**No.** El sistema no permite eliminar pólizas permanentemente (protección de datos y auditoría). Solo se pueden **archivar** para que no aparezcan en el listado normal.

### ¿Por qué no veo ciertas pólizas?

Puede ser por tu **rol** (solo ves tu cartera o tu NPN), porque están **archivadas**, o porque aún son **cotizaciones** (míralas en el menú Cotizaciones).

### ¿Qué pasa si dos personas abren la misma póliza?

El sistema muestra quién está en línea. Solo uno puede **editar** a la vez; el otro ve en modo lectura hasta que se libere.

### ¿El cliente ve lo que escribo en las notas?

**No.** Las notas son **internas** del equipo. El cliente solo ve su portal.

### ¿Puedo usar el celular?

Sí, el sistema es una página web adaptable. Sin embargo, para capturar pólizas completas con muchos campos, **computadora o tablet** es más cómodo.

### Me sacó a la pantalla de login un momento y volví al dashboard

Eso puede pasar si la sesión renovó automáticamente. Si ocurre seguido, avisa a soporte técnico.

### ¿Dónde está el número de seguro social completo?

Solo roles autorizados (coordinador, sherpa, admin) ven SSN y datos bancarios completos. Si no lo ves, es por protección de datos — no es un error.

### ¿Cómo exporto pólizas a Excel?

Menú **Configuración → Importar / Exportar pólizas**, o la página **Pólizas → Exportar** según la versión desplegada. Pide ayuda a tu coordinador si no tienes permiso.

---

## Glosario en palabras simples

| Término | Significado |
|---------|-------------|
| **Póliza** | Contrato de seguro activo o en trámite oficial |
| **Cotización (QUOTE)** | Borrador inicial antes de inscribir en el mercado |
| **Aplicante** | Persona que queda cubierta por el seguro |
| **Dependiente** | Familiar en el expediente que puede o no estar cubierto |
| **Titular** | Cliente principal de la póliza |
| **Prima mensual** | Lo que el cliente paga cada mes |
| **Subsidio / crédito fiscal** | Ayuda del gobierno que reduce el costo (ACA) |
| **ID de mercado** | Número identificador en el marketplace |
| **NPN** | Número nacional del productor de seguros (agente) |
| **FFM** | Federally Facilitated Marketplace — mercado federal |
| **Metal** | Nivel de cobertura ACA: Bronce, Plata, Oro, Platino |
| **Sherpa** | Persona que inscribe pólizas en el sitio del gobierno |
| **Evento de vida** | Cambio del cliente que afecta su seguro |
| **Archivar** | Guardar póliza en el archivo sin borrarla |
| **Portal** | Entrada separada donde el cliente ve sus datos |
| **Dashboard** | Tablero con números y gráficos del negocio |
| **CRM** | Sistema de gestión de relación con clientes (esta herramienta) |
| **Recordatorio** | Alarma con fecha para no olvidar una tarea |
| **Etiqueta** | Etiqueta de color para organizar documentos |

---

## Cierre

Lumina CRM centraliza en un solo lugar todo el ciclo de vida de un seguro de salud: desde el primer contacto con el cliente hasta la inscripción en el marketplace, el seguimiento de pagos, documentos y cambios de vida.

Si algo no cuadra con lo que ves en pantalla, puede que tu agencia tenga una versión ligeramente distinta o permisos personalizados — en ese caso, **tu coordinador o Super Admin** es la primera persona a quien debes preguntar.

Para documentación técnica (desarrolladores y sistemas), existen archivos separados: `API_CRUD_DETAILED.md`, `FRONTEND_DOC.md` y `VPS_DEPLOY_UBUNTU.md`.

---

**Última actualización:** Julio 2026  
**Audiencia:** Empleados y operadores del CRM (sin conocimientos técnicos)  
**Sistema:** Lumina CRM — BHealth Insurance
