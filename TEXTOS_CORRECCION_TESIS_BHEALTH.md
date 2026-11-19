# Textos de corrección para la tesis sobre Bhealth-Insurance

## Cómo usar este documento

Los números de página corresponden a las páginas del PDF de la tesis. En cada apartado se indica el párrafo o elemento que debes localizar y se ofrece un texto listo para sustituirlo o incorporarlo. Los textos se redactaron para describir el proyecto que aparece en el repositorio: un CRM de agencia de seguros con portal de cliente, no un sistema central de una compañía aseguradora para tarificar riesgos y liquidar siniestros.

Puedes ajustar los nombres institucionales y los datos metodológicos a la información oficial del trabajo. No incluyo correcciones ni sustituciones para los resultados medidos, las cifras de encuestas, las métricas de rendimiento ni los cálculos de ROI, de acuerdo con tu indicación. Sí corrijo las afirmaciones funcionales y técnicas que describen capacidades del software.

---

## 1. Resumen — PDF, página 8

**Localiza y sustituye el párrafo que comienza:** «El presente Trabajo de Grado tiene como objetivo desarrollar un sistema web centralizado…». Sustituye también los descriptores si deseas que el resumen represente el alcance real del proyecto.

**Texto listo para pegar:**

```text
El presente Trabajo de Grado aborda el análisis, diseño y desarrollo de una plataforma web para centralizar procesos administrativos y operativos de Bhealth Insurance. El sistema funciona como un CRM de agencia de seguros y organiza información relacionada con agencias, agentes, clientes, grupos familiares, productos, cotizaciones y pólizas. Su flujo permite registrar una cotización, completar posteriormente los datos del plan y del expediente, validar la información requerida y transferirla al proceso operativo correspondiente. La solución también incorpora funcionalidades de gestión documental, notas, pagos registrados, cambios de vida, citas, recordatorios, seguimiento de actividad y un portal separado para que el cliente consulte sus pólizas y envíe solicitudes de actualización o documentos. La arquitectura está compuesta por una interfaz web desarrollada con Next.js, React y TypeScript, y una API construida con Django REST Framework; la autenticación utiliza JWT y el acceso se organiza mediante roles y permisos. El proyecto centraliza y facilita el seguimiento de la operación de una agencia, pero no sustituye los sistemas de las aseguradoras ni realiza por sí mismo la tarificación actuarial, la emisión contractual o la liquidación de siniestros.

Descriptores: CRM para agencias de seguros, gestión de cotizaciones y pólizas, flujo departamental, portal del cliente, API REST, control de acceso por roles, trazabilidad.
```

---

## 2. Planteamiento del problema — PDF, páginas 9–11

### 2.1 Sustitución del planteamiento específico sobre Bhealth

**Localiza desde el párrafo que comienza:** «En el contexto venezolano, el sector asegurador enfrenta desafíos particulares…», y sustituye hasta el párrafo que termina con la referencia a la protección de PII y PHI. El primer párrafo metodológico y las citas teóricas generales pueden conservarse.

**Texto listo para pegar:**

```text
En el contexto de Bhealth Insurance, la necesidad atendida por el proyecto se relaciona con la administración coordinada de la operación de una agencia de seguros. El diagnóstico expuesto en esta investigación identifica dificultades para mantener la información de clientes, familias, agentes, cotizaciones, pólizas y documentos organizada y accesible para las personas que participan en las distintas etapas del servicio. Cuando estos datos se gestionan mediante canales o registros separados, aumenta el esfuerzo necesario para localizar antecedentes, verificar qué información falta, conocer quién debe atender un expediente y dar continuidad a las solicitudes de los clientes. Por ello, el problema tecnológico abordado no consiste en calcular el riesgo asegurado ni en resolver reclamos médicos, sino en dotar a la agencia de una herramienta común para registrar expedientes y dar seguimiento a sus actividades.

La operación de una agencia comprende tareas diferentes que se relacionan entre sí: registrar los datos del cliente y su grupo familiar, seleccionar el tipo de producto, crear una cotización, completar los datos del plan cuando estén disponibles, incorporar documentos y notas, atender cambios de vida y coordinar las acciones de los agentes y del personal de soporte. Sin una secuencia visible para estas tareas, el seguimiento depende de la comunicación entre las personas y puede resultar difícil identificar el estado del expediente, el área responsable o el siguiente paso. Un sistema centralizado permite estructurar esta información y asociar las acciones realizadas con usuarios, fechas y pólizas, ofreciendo una base de consulta para la operación cotidiana y para la supervisión de la cartera.

La solución desarrollada para Bhealth Insurance responde a esta necesidad mediante un CRM web con una API centralizada, catálogos de productos y planes, gestión de clientes y pólizas, control documental y etapas de trabajo entre áreas. El sistema también contempla un portal de cliente separado del entorno interno, desde el cual el asegurado puede consultar información propia y enviar solicitudes que posteriormente revisa el personal autorizado. La plataforma apoya la organización y trazabilidad administrativa del expediente; las decisiones de elegibilidad, la selección final de cobertura, la contratación con la aseguradora y el procesamiento de pagos o reclamos se realizan fuera de su alcance cuando dependen de portales o entidades externas.
```

### 2.2 Interrogantes de la investigación

**Localiza las tres preguntas que comienzan:** «¿Con qué frecuencia se presentan inconsistencias…?» y sustituye el conjunto por preguntas centradas en la operación real del CRM.

**Texto listo para pegar:**

```text
En virtud de la problemática planteada, la investigación se orienta a responder las siguientes interrogantes: ¿Qué procesos de la agencia requieren centralizar la información de clientes, familias, agentes, cotizaciones y pólizas? ¿Qué requerimientos funcionales permiten registrar los expedientes, organizar los documentos y coordinar su atención entre los departamentos de Bhealth Insurance? ¿Cómo puede un CRM web apoyar el seguimiento de las cotizaciones, los cambios solicitados por los clientes y las actividades posteriores a la afiliación, manteniendo controles de acceso acordes con los roles del personal y del portal de clientes?
```

### 2.3 Objetivo general y objetivos específicos

**Localiza el objetivo general que comienza:** «Desarrollo de un sistema web escalable…», y los objetivos específicos inmediatamente posteriores. Sustituye ambos conjuntos:

```text
Objetivo General

Desarrollar una plataforma web centralizada para apoyar la gestión administrativa y operativa de Bhealth Insurance como agencia de seguros, mediante un CRM que permita organizar clientes, grupos familiares, agentes, cotizaciones, pólizas, documentos y solicitudes de servicio, así como coordinar el seguimiento de los expedientes entre los departamentos y el portal del cliente.

Objetivos Específicos

• Analizar los procesos de la agencia relacionados con el registro de clientes y grupos familiares, la creación de cotizaciones, la gestión de pólizas y el seguimiento de solicitudes.
• Definir los requerimientos funcionales y no funcionales de un CRM web que centralice la información operativa y permita la consulta diferenciada según los perfiles de usuario.
• Diseñar e implementar una arquitectura web compuesta por una interfaz Next.js y una API Django REST Framework, con modelos relacionales para las entidades principales del dominio de la agencia.
• Incorporar funcionalidades de gestión documental, seguimiento de cambios de vida, colaboración interna, trazabilidad y atención mediante un portal separado para clientes.
• Describir y evaluar la solución implementada conforme al alcance funcional del proyecto, diferenciando las capacidades disponibles de las integraciones y procesos que dependen de terceros.
```

---

## 3. Justificación de la investigación — PDF, páginas 12–16

### 3.1 Párrafo que menciona TaskUp, cálculo de primas y carga asíncrona — página 12

**Localiza el párrafo que comienza:** «Desde el punto de vista del desarrollo, el uso de tecnologías como Django/Python…». Sustitúyelo para eliminar el servicio TaskUp, el motor de primas y el procesamiento asíncrono que no aparecen en el proyecto.

```text
Desde el punto de vista del desarrollo, el uso de Python, Django y Django REST Framework permite estructurar las reglas de validación y las operaciones de consulta y actualización de los expedientes en una API común. El frontend web consume estos servicios para presentar formularios de clientes, grupos familiares, cotizaciones, pólizas y documentos, mientras que los modelos relacionales vinculan la información necesaria para dar continuidad al trabajo de la agencia. La automatización que aporta el sistema se refiere principalmente a la organización del registro, la validación de datos requeridos, la clasificación de las cotizaciones y pólizas, y la trazabilidad de las acciones realizadas; no comprende un cálculo actuarial de primas ni el procesamiento automático de una contratación con una aseguradora. Las notificaciones y recordatorios apoyan determinados eventos de trabajo, como asignaciones, menciones y solicitudes, y no deben describirse como un servicio asíncrono general si no se documenta una infraestructura específica para ello.
```

### 3.2 Apartados técnicos de backend, base de datos, seguridad y roles — páginas 13–14

**Localiza los elementos numerados que comienzan:** «Construcción de Backend Escalable…», «Seguridad Avanzada para Datos Sensibles…» y «Frontend Dinámico y Control de Concurrencia…». Puedes sustituirlos por los siguientes párrafos.

```text
1. Arquitectura de la aplicación y persistencia de datos: La solución separa la interfaz web de los servicios de backend mediante una API REST desarrollada con Django REST Framework. El backend define modelos, serializadores, permisos y operaciones para las entidades del CRM, entre ellas agencias, agentes, clientes, productos, planes, pólizas, documentos y cambios de vida. La configuración admite una base PostgreSQL cuando se proporcionan los parámetros correspondientes y contempla SQLite como alternativa local; por tanto, la descripción debe identificar el motor utilizado en el entorno específico evaluado, sin atribuir al proyecto una versión fija de PostgreSQL, una extensión criptográfica o componentes de alta disponibilidad que no estén configurados en el repositorio.

2. Controles de acceso y protección de información: El sistema autentica a los usuarios mediante JWT y aplica permisos asociados a roles, perfiles y alcance de cartera para limitar las operaciones disponibles en el CRM y en el portal de clientes. Además, existen registros de actividad, historial de cambios de póliza y mecanismos de cifrado Fernet aplicados a campos concretos de credenciales de portales externos y ciertos datos de tarjetas. La existencia de estos controles no significa que toda la información personal, migratoria, financiera o relacionada con la salud se encuentre cifrada de forma general ni demuestra por sí sola el cumplimiento integral de una norma de privacidad. En consecuencia, la tesis debe describir únicamente los campos y controles comprobados, y presentar cualquier evaluación normativa como un análisis separado del funcionamiento del software.

3. Interfaz y control de concurrencia: La interfaz se implementa con Next.js, React, TypeScript y componentes organizados por áreas funcionales. El frontend distingue las rutas del CRM de empleados y las del portal de clientes, y utiliza mecanismos de autenticación y permisos de interfaz para dirigir a cada perfil a su espacio de trabajo. En el detalle de póliza existe una función de presencia y bloqueo de edición que comunica cuándo otro usuario está trabajando sobre el expediente y limita la edición concurrente según el estado del bloqueo. Este mecanismo reduce el riesgo de cambios simultáneos, pero debe describirse como un control de concurrencia de la aplicación, no como una garantía absoluta de que nunca ocurrirán conflictos o sobrescrituras.
```

### 3.3 Privacidad e impacto social — páginas 14–16

**Localiza las frases que afirman que el sistema «garantiza» la protección, continuidad de tratamientos, cumplimiento estricto o la recepción de cobertura en menor tiempo. Sustitúyelas por este párrafo, conservando las citas legales que hayan sido verificadas por tu tutor:**

```text
Desde la perspectiva social, el sistema busca facilitar la organización y el seguimiento de la información administrativa asociada a los clientes y sus pólizas. La centralización del expediente y la separación de accesos para el personal y el portal de clientes pueden contribuir a que las solicitudes, los documentos y las acciones pendientes sean más fáciles de localizar y atender. Debido a que el CRM puede almacenar información personal, familiar, migratoria, financiera y relacionada con necesidades de salud, su uso requiere controles de acceso, prácticas de gestión de credenciales, reglas de conservación y revisión periódica de permisos. La implementación de funcionalidades técnicas no constituye por sí misma una certificación de cumplimiento legal ni sustituye las obligaciones de la agencia, de las aseguradoras o de los proveedores que intervienen en el proceso. Por ello, el aporte social del proyecto se presenta como apoyo a la organización del servicio y a la trazabilidad administrativa, sin atribuirle la capacidad de decidir coberturas, garantizar la continuidad de tratamientos o evitar por completo incidentes de privacidad.
```

---

## 4. Delimitaciones y alcance — PDF, páginas 17–20

### 4.1 Delimitación tecnológica — página 17

**Localiza la lista «Alcance Tecnológico (Stack Incluido)» y sustituye sus viñetas por este texto:**

```text
Alcance Tecnológico: El backend está desarrollado en Python con Django 5.2 y Django REST Framework 3.16; el frontend utiliza Next.js 16 con App Router, React 19, TypeScript, Tailwind CSS y Zustand. La comunicación entre ambos componentes se realiza mediante servicios web y datos estructurados en JSON. La configuración de base de datos admite PostgreSQL mediante variables de entorno y utiliza SQLite como alternativa para el desarrollo local, por lo que la versión y el motor de cada ambiente deben indicarse conforme a la instalación realmente evaluada. La autenticación se basa en JWT y el acceso a funciones y expedientes se organiza mediante perfiles, roles y permisos. El repositorio incluye funcionalidades de presencia y bloqueo de edición para determinados expedientes, así como integración documentada con Zoho Sign, servicios de consentimiento y consulta de ubicación por código postal. No forman parte del stack comprobado componentes Celery, Redis, una extensión criptográfica de PostgreSQL ni una arquitectura de microservicios; tampoco debe afirmarse TLS 1.3 como configuración específica sin verificar el servidor y el certificado del ambiente de despliegue.
```

### 4.2 Aspectos excluidos e incluidos — página 18

**Localiza la sección «Aspectos Excluidos (Fuera del Alcance)». Sustituye la lista por:**

```text
Aspectos incluidos y excluidos del alcance: La plataforma comprende la gestión administrativa de clientes, grupos familiares, agentes, cotizaciones, pólizas, documentos, solicitudes de cambios de vida, notas, recordatorios y otras tareas de seguimiento propias de una agencia. También incluye un portal de clientes separado del CRM interno para consultar pólizas propias y enviar solicitudes o documentos, los cuales son revisados y procesados por el personal autorizado. El sistema no sustituye el portal de HealthCare.gov ni el de las aseguradoras, no determina por sí mismo la elegibilidad o el plan que corresponde al cliente, no calcula primas mediante un modelo actuarial, no emite el contrato de seguro en nombre de la aseguradora y no administra un módulo de siniestros o de liquidación de reclamos médicos. Tampoco se presenta como una aplicación móvil nativa; el acceso se ofrece mediante la aplicación web. El registro o seguimiento de información de pago no debe confundirse con el cobro directo mediante una pasarela bancaria, cuya integración no se encuentra demostrada como parte de este alcance.
```

### 4.3 Alcance de la investigación — página 19

**Localiza el párrafo que comienza:** «En virtud de lo expuesto, el alcance de este trabajo se circunscribe…», la lista de módulos y el párrafo que excluye el portal de clientes. Sustituye ese bloque completo por:

```text
El alcance de este trabajo comprende el análisis, diseño y desarrollo de una plataforma web destinada a centralizar procesos administrativos y operativos de Bhealth Insurance como agencia de seguros. La solución integra la administración de perfiles, roles, departamentos, agencias y agentes; el registro de clientes y sus grupos familiares; la selección de tipos de producto; la creación y seguimiento de cotizaciones; la gestión de pólizas y sus etapas de trabajo; el almacenamiento organizado de documentos; y el registro de notas, pagos, médicos, medicamentos, citas, recordatorios y cambios de vida. La plataforma incluye además un portal separado para que el cliente consulte la información asociada a sus propias pólizas, solicite actualizaciones y entregue documentos para revisión del personal. El expediente puede pasar por diferentes responsables de la agencia, y el sistema conserva información de actividad y asignación para apoyar la coordinación del trabajo.

El proyecto se limita a la organización y seguimiento de la operación propia de la agencia mediante una interfaz web y una API REST. La selección definitiva de productos, la evaluación de elegibilidad, la formalización contractual, la actualización de datos en portales externos, la decisión sobre cobertura, la tarificación actuarial y la liquidación de reclamos corresponden a procesos o entidades externos y no deben presentarse como funciones ejecutadas por el CRM. El sistema tampoco constituye una pasarela de pago ni una aplicación móvil nativa. Las integraciones con terceros se circunscriben a los servicios que se encuentren realmente configurados y probados en la versión evaluada, como la firma electrónica documentada, el consentimiento y la consulta de ubicación basada en ZIP.
```

---

## 5. Marco teórico referencial — PDF, páginas 27–45

### 5.1 Descripción del CRM y embudo comercial — páginas 27–29

**Localiza el texto que describe gestión de riesgo, emisión, suscripción médica y siniestros, así como los dos párrafos repetidos del «Pipeline de Ventas». Sustituye la aplicación de esos conceptos a Bhealth por:**

```text
En el proyecto Bhealth Insurance, el concepto de CRM se aplica a la gestión de relaciones e información de clientes dentro de una agencia de seguros. El sistema permite organizar datos personales y familiares, asociar clientes con agentes y pólizas, registrar el tipo de producto y el plan seleccionado, mantener documentos y notas en el expediente y coordinar la atención de las solicitudes. La aplicación almacena datos de la póliza y del pago que son incorporados por los usuarios, pero no realiza una evaluación actuarial de riesgo ni determina automáticamente el precio o la cobertura. Asimismo, el registro de información médica, de medicamentos o de médicos se utiliza como información administrativa asociada al expediente y no convierte al CRM en una historia clínica ni en una plataforma de administración de reclamos.

El flujo comercial representado en el CRM comienza con la creación de un expediente de cliente y una cotización. En el registro inicial se selecciona el tipo de producto, se identifica al agente y se incorporan los datos personales, familiares y de dirección requeridos. La cotización queda identificada con el estado correspondiente y se muestra en el apartado de Cotizaciones. Posteriormente, el personal puede completar el plan, la aseguradora, la información económica y los documentos que correspondan, validar los requisitos disponibles y utilizar la acción de envío para trasladar el expediente al flujo de póliza. Las etapas departamentales organizan la revisión y el trabajo de los responsables de la agencia; no representan una suscripción médica ni la emisión del contrato por parte de la aseguradora.
```

### 5.2 API REST y tabla de endpoints — páginas 29–30

**Conserva la explicación general del estilo REST si deseas, pero sustituye el párrafo que pone los registros de siniestros como ejemplo y revisa la tabla que anuncia rutas o recursos no implementados. Texto de sustitución:**

```text
En Bhealth Insurance, la API REST expone operaciones para consultar y actualizar los recursos del CRM, incluidos clientes, agentes, catálogos, pólizas, cotizaciones, documentos, pagos, cambios de vida y notificaciones. Entre las operaciones del ciclo de póliza se encuentran el listado de cotizaciones, la validación de los requisitos de envío y la acción para trasladar una cotización al flujo de póliza. El portal de clientes utiliza servicios separados para consultar la información autorizada y presentar solicitudes o documentos. Los recursos y métodos de cada tabla deben corresponder a las rutas registradas en el backend de la versión evaluada; no deben incluirse rutas como `/api/v1/siniestros/` ni operaciones de reclamos si no existen en el código. De manera similar, cualquier descripción de `DELETE` debe distinguir los recursos que permiten eliminación de aquellos, como las pólizas, cuya política de negocio impide el borrado permanente y utiliza archivado.
```

**Para la tabla de ejemplo, puedes utilizar las siguientes filas como base, verificando los prefijos exactos en `backend/config/urls.py` y `backend/api/urls.py`:**

```text
Pólizas | /api/polizas/ | GET, POST, PUT, PATCH | Consulta y administración de expedientes de póliza, con permisos y reglas de negocio.
Cotizaciones | /api/polizas/cotizaciones/ | GET | Consulta de pólizas que mantienen estado de cotización.
Validación de envío | /api/polizas/{id}/validar-envio/ | GET | Revisión de requisitos antes de enviar una cotización.
Envío de cotización | /api/polizas/{id}/enviar/ | POST | Transición de la cotización al flujo de póliza cuando cumple las validaciones.
Cambios de vida | /api/cambios-de-vida/ | GET, POST, PATCH | Consulta y seguimiento de solicitudes de cambios asociadas a pólizas, según permisos.
```

### 5.3 PostgreSQL y persistencia — página 32

**Sustituye el párrafo que afirma que PostgreSQL 16 es la única fuente de verdad del proyecto por:**

```text
El proyecto utiliza modelos relacionales de Django para representar agencias, agentes, clientes, grupos familiares, productos, aseguradoras, planes, pólizas, documentos y otros componentes operativos. La configuración del backend permite conectarse a PostgreSQL cuando el entorno proporciona una URL de base de datos o parámetros de conexión; para el desarrollo local también existe una configuración de respaldo con SQLite. En consecuencia, la base de datos efectiva depende del ambiente de ejecución y de sus variables de configuración. La tesis debe identificar cuál motor se empleó durante las pruebas que documenta, sin atribuir al repositorio una versión específica de PostgreSQL o extensiones adicionales que no formen parte de la configuración comprobada.
```

### 5.4 JWT, cifrado y marco legal — páginas 32–34

**Sustituye la descripción que afirma que SSN, PHI y datos bancarios están cifrados globalmente, junto con la matriz de protección no verificada, por:**

```text
La autenticación del backend se configura con JWT mediante SimpleJWT. En la configuración revisada, el token de acceso tiene una vigencia de sesenta minutos, el token de renovación de un día y se habilitan la rotación y la lista negra de tokens de renovación. En el frontend se conserva el estado de autenticación y se utilizan cookies auxiliares para el control de rutas; estos detalles describen el mecanismo implementado y no deben confundirse con una certificación integral de seguridad del navegador o de la infraestructura.

El repositorio contiene una utilidad basada en Fernet y llamadas de cifrado en serializadores para campos concretos, entre ellos credenciales de acceso a portales externos y determinados datos de tarjetas. No se debe afirmar que el SSN, todos los datos de salud o la totalidad de la información bancaria se cifran mediante Fernet, porque ese alcance no queda demostrado por el uso observado. La tesis puede describir la existencia de cifrado selectivo, permisos por rol, controles de visibilidad y registros de auditoría, identificando con precisión qué información cubre cada medida. La afirmación de cumplimiento con HIPAA u otra regulación requiere determinar primero su aplicabilidad al contexto y verificarla mediante un análisis legal y técnico; no se deriva automáticamente del uso de JWT, de un registro de auditoría o de una biblioteca criptográfica.
```

### 5.5 React, tipos de datos y rutas — páginas 34–38

**En los párrafos de aplicación del frontend, sustituye los ejemplos de siniestros, liquidadores y reclamos por este texto:**

```text
En el frontend de Bhealth Insurance, React organiza la interfaz en componentes reutilizables para el dashboard, la navegación del CRM, los formularios de clientes y pólizas, el expediente documental, las solicitudes de cambios de vida y el portal del cliente. TypeScript permite definir estructuras para entidades efectivamente manejadas por la aplicación, como agencia, agente, cliente, producto, plan, póliza, documento, cambio de vida, pago y cita. Next.js App Router organiza las rutas de autenticación, las secciones internas del CRM y el área independiente del cliente. Estos componentes facilitan la presentación y validación de la información capturada por los usuarios, pero no constituyen un motor de cálculo de primas, un sistema de reclamos ni una interfaz para liquidar siniestros. Los ejemplos, cuadros y capturas de esta sección deben reflejar las pantallas presentes en la versión del sistema que se está describiendo.
```

### 5.6 Modelo de datos, etapas, integraciones y despliegue — páginas 40–45

**Sustituye la aplicación de las relaciones a reclamos, coberturas y microservicios y los párrafos que atribuyen despliegue Docker/TLS específico, por:**

```text
El modelo relacional del CRM representa las relaciones entre agencia y agentes, clientes y pólizas, pólizas y miembros de la familia, así como los vínculos de cada expediente con sus productos, planes, aseguradoras, direcciones, documentos, pagos y registros de actividad. Una póliza puede relacionarse con varios clientes mediante una entidad intermedia que distingue al solicitante principal, a los aplicantes y a otros miembros del grupo familiar. El diseño no debe incluir relaciones con reclamos, cobertura calculada o liquidaciones como si fueran entidades implementadas, salvo que se presente evidencia de un módulo adicional que no está en el repositorio revisado.

El flujo departamental organiza el trabajo de la agencia mediante etapas de captura, revisión, procesamiento por Sherpa, devolución y finalización. Las transiciones registran la acción y los usuarios que participan, y se apoyan en permisos y notas del expediente. Este flujo describe la coordinación interna de la inscripción y de la documentación; la inscripción efectiva en un Marketplace o en el portal de una aseguradora puede seguir requiriendo que el responsable utilice esos sistemas externos.

Entre los servicios externos documentados se encuentran la firma electrónica de contratos de agentes mediante Zoho Sign, el proveedor configurado para solicitudes de consentimiento y la consulta de información geográfica a partir del código postal. Además, la interfaz ofrece enlaces de acceso a recursos de HealthCare.gov. Debe distinguirse entre una integración técnica con intercambio de datos y un enlace que simplemente abre una página externa; no se debe describir como conexión automática al Marketplace una funcionalidad que consiste únicamente en un acceso directo.

La documentación del repositorio contempla procedimientos de despliegue para frontend y backend, incluidos escenarios con Nginx, Gunicorn y servicios del sistema, además de una configuración de Render. La arquitectura de la aplicación se presenta como una interfaz Next.js que consume una API Django REST, con la base de datos seleccionada según la configuración del ambiente. La tesis debe indicar cuál entorno se utilizó efectivamente para las pruebas y describir solo sus componentes comprobados. No deben atribuirse contenedores Docker, Redis, puertos, reglas de firewall, certificados TLS de una versión concreta o una topología de alta disponibilidad si no se verificaron en el ambiente desplegado.
```

---

## 6. Marco metodológico: descripción de la solución — PDF, páginas 51–53

**Localiza los párrafos de contextualización del sistema que describen microservicios, caché Redis, reducción de errores en siniestros, suscripción o procesamiento de reclamos. Conserva las definiciones metodológicas citadas que sean pertinentes y sustituye solo la aplicación al proyecto por:**

```text
En el marco de esta investigación, la solución tecnológica se entiende como un CRM web para organizar la operación de una agencia de seguros. El desarrollo comprende una interfaz web para empleados y un portal para clientes, conectados con una API que administra usuarios, agencias, agentes, clientes, grupos familiares, productos, cotizaciones, pólizas y sus documentos relacionados. La aplicación incorpora un flujo de trabajo entre áreas, controles de acceso y funciones de seguimiento posteriores al registro de la cotización, entre ellas cambios de vida, notas, recordatorios, citas y datos de pago. La unidad de análisis funcional es el expediente operativo de la agencia y la forma en que la información asociada a este se registra, consulta y actualiza; no son objeto del sistema el cálculo actuarial, la decisión de suscripción por parte de una aseguradora ni la liquidación de reclamaciones médicas.

La arquitectura implementada corresponde a una aplicación web desacoplada en la que Next.js presenta las vistas y consume una API desarrollada con Django REST Framework. Los modelos y reglas de autorización se ejecutan en el backend, mientras que la configuración del entorno selecciona el motor relacional correspondiente. Esta descripción permite analizar la organización del software y sus funcionalidades sin atribuirle infraestructura de microservicios, caché Redis, tareas Celery o procesos de tarificación que no se encuentran acreditados en el proyecto. La caracterización metodológica de la solución debe centrarse en las funciones efectivamente disponibles, los tipos de usuarios que las utilizan y las etapas del expediente que el sistema permite gestionar.
```

---

## 7. Desarrollo de la propuesta tecnológica — PDF, páginas 84–89

> Esta sección corrige únicamente el alcance y la descripción técnica de la propuesta. No sustituye los cuadros de porcentajes, los datos de encuestas ni las mediciones del capítulo de resultados.

### 7.1 Objetivo, objetivos específicos y alcance — página 84

**Sustituye el objetivo general que comienza:** «Desplegar una plataforma web integral…», los cuatro objetivos específicos y el párrafo de alcance por:

```text
Objetivo General: Desarrollar una plataforma web para centralizar la gestión administrativa y operativa de Bhealth Insurance como agencia de seguros, mediante un CRM integrado por una interfaz para el personal, una API de servicios y un portal separado para clientes.

Objetivos Específicos:
1. Organizar en modelos relacionales la información de agencias, agentes, clientes, grupos familiares, productos, planes, pólizas y expedientes asociados.
2. Implementar el registro de cotizaciones y su seguimiento hasta la validación y transferencia al flujo operativo de póliza.
3. Incorporar herramientas de gestión documental, notas, pagos registrados, cambios de vida, citas, recordatorios e historial de actividad.
4. Definir mecanismos de autenticación y autorización basados en usuarios, roles, perfiles y permisos para separar las operaciones del personal de las funciones disponibles en el portal de clientes.
5. Desarrollar interfaces web que permitan al personal coordinar la atención de los expedientes y al cliente consultar la información propia y enviar solicitudes para revisión.

Alcance: La solución comprende el registro y seguimiento de información comercial y administrativa de clientes, familias, agentes, cotizaciones y pólizas, además de la coordinación del expediente entre las áreas de la agencia. El sistema facilita la captura, consulta, actualización y trazabilidad de los datos que utilizan los empleados y el portal de clientes, pero no reemplaza los sistemas de las aseguradoras ni ejecuta por cuenta propia un proceso de suscripción actuarial, un cálculo automático de primas, la emisión contractual, la decisión de cobertura o la liquidación de siniestros. La confirmación de una inscripción y la gestión de productos externos permanecen sujetas a los procesos y plataformas correspondientes.
```

### 7.2 Arquitectura y modelo de datos — páginas 85–87

**Sustituye el párrafo que describe una SPA React y escalamiento horizontal en contenedores por:**

```text
La solución utiliza una arquitectura web desacoplada compuesta por un frontend desarrollado con Next.js, React y TypeScript, y un backend Django que expone operaciones mediante Django REST Framework. El frontend organiza las rutas del CRM de empleados y del portal de clientes, y se comunica con la API para consultar y actualizar los recursos autorizados. El backend concentra los modelos de datos, validaciones y permisos; la persistencia se configura por ambiente y puede utilizar PostgreSQL o SQLite conforme a la configuración del proyecto. Esta separación facilita mantener diferenciadas la interfaz y la lógica de servicios, pero no debe confundirse con una arquitectura de microservicios ni utilizarse como evidencia suficiente de escalabilidad horizontal, rendimiento o alta disponibilidad, características que requieren una configuración y pruebas específicas.
```

**Elimina los Cuadros 18 y 19 si representan el modelo ficticio de póliza y la entidad de siniestros. Sustitúyelos por este texto y por un DER generado a partir de los modelos reales:**

```text
El núcleo de datos de la plataforma corresponde al expediente operativo de una póliza de agencia. El modelo relaciona la póliza con un estado, un tipo de producto, un plan, una aseguradora cuando se encuentra definida, el agente asignado y el agente que registró el expediente. También conserva los identificadores utilizados para el seguimiento del mercado, la fecha efectiva, los valores de costo, subsidio y prima que son registrados por el usuario, las direcciones relacionadas y la etapa del flujo departamental. La relación entre pólizas y clientes permite incluir al titular y a los demás integrantes del grupo familiar, identificando su parentesco y su participación como solicitantes o aplicantes. El expediente puede asociarse, además, con documentos, carpetas, notas, pagos, médicos, medicamentos, cambios de vida, recordatorios, citas, transferencias y registros de auditoría. El repositorio no define un modelo de siniestros ni campos de monto reclamado, monto aprobado o liquidación; por ello, tales tablas deben retirarse del DER y del diccionario de datos, no presentarse como parte del sistema implementado.
```

### 7.3 API y pantallas — páginas 87–88

**Sustituye el ejemplo de payload de cotización automática y las referencias a una lista de siniestros por:**

```text
Los ejemplos de interacción de la API deben representar operaciones existentes en el ciclo de una cotización. Una solicitud de creación registra el tipo de producto y la información inicial disponible del cliente, su grupo familiar, el agente y la dirección física; la respuesta identifica el expediente creado y su estado de cotización. En una etapa posterior, el usuario autorizado completa la información del plan y del expediente, solicita la validación de los requisitos y, si estos se cumplen, ejecuta la acción de envío para cambiar el estado operativo. Las capturas de interfaz deben corresponder al asistente de nueva póliza, al listado de Cotizaciones, al detalle de una póliza, al portal del cliente, a los cambios de vida o a los documentos, según las pantallas realmente disponibles. Deben retirarse las pantallas de analistas de siniestros y los ejemplos de reembolsos, aprobaciones médicas o comprobantes de reclamo, pues no corresponden a los módulos del CRM revisado.
```

**Si mantienes las figuras de interfaz, sustituye sus títulos por pies de figura acordes con las capturas reales, por ejemplo:**

```text
Figura 2. Interfaz del asistente para registrar una cotización y los datos iniciales del cliente.
Figura 3. Vista del expediente de póliza con sus secciones de información, documentos y seguimiento operativo.
```

---

## 8. Propuesta, beneficiarios y plan operativo — PDF, páginas 96–99

### 8.1 Denominación del proyecto y objetivo general — página 96

**Sustituye el título de la propuesta y el objetivo que menciona siniestros, cálculo de primas y emisión:**

```text
Denominación del Proyecto

Plataforma Web CRM para la Gestión Administrativa y Operativa de Bhealth Insurance.

Objetivo General de la Propuesta

Desarrollar una plataforma web compuesta por un CRM interno y un portal separado para clientes, conectados mediante una API REST, con el propósito de centralizar la información de agencias, agentes, clientes, grupos familiares, cotizaciones, pólizas y documentos, y facilitar la coordinación y trazabilidad de los expedientes durante la operación de Bhealth Insurance.
```

### 8.2 Objetivos de la propuesta — página 96

**Sustituye la lista que menciona motor de cotización, patologías, liquidación de reclamos y auditoría inmutable por:**

```text
Objetivos Específicos de la Propuesta

1. Modelar las entidades necesarias para administrar agencias, agentes, clientes, grupos familiares, tipos de producto, planes, aseguradoras, cotizaciones y pólizas.
2. Desarrollar las funciones de registro y consulta de expedientes, incluyendo la creación inicial de cotizaciones y las operaciones de validación y envío disponibles para los usuarios autorizados.
3. Incorporar secciones para documentos, notas, datos de pago registrados, cambios de vida, médicos, medicamentos, recordatorios, citas e historial de actividad.
4. Implementar el acceso diferenciado del personal y de los clientes mediante autenticación, perfiles, roles y permisos.
5. Facilitar la coordinación interna del expediente mediante etapas departamentales, asignaciones, presencia de usuarios e información de seguimiento.
6. Documentar la arquitectura, los módulos funcionales y las limitaciones de integración del sistema, distinguiendo entre capacidades propias del CRM y procesos que se completan en plataformas externas.
```

### 8.3 Beneficiarios y localización — página 97

**Sustituye los párrafos que presentan ajustadores de siniestros, liquidación de reclamos, emisión de carnets y despliegue en contenedores por:**

```text
Beneficiarios de la Propuesta

Los beneficiarios directos de la propuesta son las personas que participan en la operación administrativa y comercial de Bhealth Insurance, incluidos los responsables de agencia, coordinadores, agentes, personal de soporte, personal que gestiona documentos y pagos y los demás usuarios habilitados para trabajar en el CRM. La plataforma les ofrece un expediente común para consultar los datos autorizados, revisar cotizaciones y pólizas, identificar documentos y solicitudes pendientes, registrar notas y coordinar acciones entre áreas. Los beneficiarios indirectos son los clientes y sus grupos familiares, quienes cuentan con un portal separado para consultar información propia y presentar solicitudes o documentos sin editar directamente los datos operativos de la póliza ni sustituir la intervención del personal encargado.

Localización y entorno de operación

El proyecto se destina a la operación de Bhealth Insurance y puede ser accedido mediante navegador desde las ubicaciones autorizadas, sujeto a la disponibilidad del entorno en que se despliegue. El repositorio separa el frontend Next.js del backend Django REST y contiene documentación de despliegue que contempla escenarios con Nginx y servicios de aplicación, además de configuración para Render. La descripción definitiva de la localización, el proveedor de alojamiento, el sistema operativo, el uso de HTTPS y la infraestructura de producción debe corresponder al ambiente realmente utilizado durante la evaluación. No se debe afirmar que el sistema funciona sobre contenedores Docker o una topología determinada si esta no se instaló y verificó.
```

### 8.4 Plan operativo y cuadro de herramientas — páginas 98–99

**En los cuadros del plan operativo y del stack, reemplaza las menciones a Docker, Redis, PostgreSQL 16, microservicios o pruebas contra ataques OWASP si no corresponden a actividades efectivamente ejecutadas. Puedes utilizar esta descripción introductoria:**

```text
El plan operativo debe separar las actividades realizadas durante el desarrollo de las actividades propuestas para una futura implantación. En la fase de análisis se documentan los flujos de registro de clientes, creación de cotizaciones, gestión de pólizas y coordinación de solicitudes; en la fase de diseño se especifican los modelos relacionales, las rutas de la API, los perfiles de acceso y las pantallas del CRM y del portal. La implementación utiliza Python, Django y Django REST Framework en el backend, y Next.js, React, TypeScript, Tailwind CSS y Zustand en el frontend. La base de datos se selecciona mediante la configuración del ambiente, con PostgreSQL cuando se proveen sus parámetros y SQLite como alternativa de desarrollo local. La fase de verificación debe enumerar únicamente las pruebas realmente ejecutadas, identificar su alcance y diferenciar pruebas funcionales de usabilidad, rendimiento y seguridad. Finalmente, el despliegue debe describir la infraestructura que se haya utilizado en la práctica, evitando presentar como ejecutadas herramientas o procedimientos que solo se consideran como recomendaciones.
```

---

## 9. Diccionario de datos y modelos — PDF, páginas 101–116

### 9.1 Párrafo de presentación del modelo

**Añade o utiliza este texto como introducción al DER y al diccionario de datos:**

```text
El diccionario de datos de la solución se deriva de los modelos del backend y representa las entidades que participan en la administración de la agencia. Entre las entidades principales se encuentran Agencia, Agente, Cliente, Dirección, TipoProducto, Aseguradora, Plan, EstadoPoliza y Poliza. La relación PolizaCliente permite asociar una póliza con el solicitante principal y con otros miembros del grupo familiar. A estas entidades se vinculan los registros de documentos y carpetas, notas, información de pago, tarjetas y cuentas registradas, médicos y medicamentos, cambios de vida, recordatorios, citas, transferencias de flujo e historial de actividad. La descripción de cada atributo debe conservar el nombre, tipo, obligatoriedad y relación que aparecen en los modelos y migraciones de la versión revisada. Las entidades de siniestros, montos reclamados, montos aprobados o beneficios calculados deben excluirse mientras no exista una implementación demostrable.
```

### 9.2 Correcciones puntuales a las tablas existentes

**Aplica estas correcciones al texto descriptivo de las tablas; conserva solo los campos que coincidan con los modelos y migraciones actuales:**

```text
• Tabla Cliente, PDF pp. 104–105: describe el campo de identificación como SSN únicamente si así se denomina en el modelo; no añadas ITIN como dato admitido si el código no lo define. Describe los campos de ingresos, estado migratorio, condición médica y datos de contacto como información almacenada en el expediente del cliente, pero no afirmes que alimentan un algoritmo de riesgo, elegibilidad o cálculo automático de primas.

• Tabla Poliza, PDF pp. 86 y siguientes: reemplaza `numero_poliza`, `monto_cobertura` y cualquier prima anual calculada automáticamente por los campos reales del modelo, que incluyen los identificadores de mercado y miembro, tipo de producto, plan, aseguradora, fecha efectiva, estado, costo, subsidio, prima mensual, agente, grupo familiar, direcciones y flujo departamental. Los importes almacenados representan valores registrados en el expediente; no deben describirse como resultados de un motor de tarificación si no existe tal función.

• Tabla CambioDeVida, PDF p. 108: describe el registro como una solicitud o evento operativo relacionado con una póliza, con tipo, datos asociados, responsables, creador, estado y fechas. No afirmes que cada evento constituye automáticamente un “evento de vida calificado” para un período especial ni que el campo de fecha límite representa un plazo legal, salvo que el sistema aplique y documente esa regla. La validación ante el Marketplace corresponde al proceso externo.

• Tabla CuentaBancaria e InfoPago, PDF pp. 111–112: describe la información bancaria como datos asociados al expediente y el estado de pago conforme a las opciones definidas en la versión del sistema evaluada. El registro de una cuenta, tarjeta, recurrencia o estado no significa que el CRM ejecute el débito, procese el pago o concilie directamente con el banco. Verifica los códigos de estado reales del modelo antes de reproducirlos, pues algunas guías del repositorio muestran etiquetas distintas a los choices del backend.

• Tabla Medicamento, PDF p. 114: describe el registro de nombre, dosis, frecuencia, duración y fechas como información de medicamentos asociada a la póliza. No afirmes que el sistema consulta formularios farmacéuticos, calcula cobertura del medicamento o selecciona planes según recetas, a menos que se incorpore una integración o lógica de negocio que lo demuestre.

• Tabla MedicoPoliza, PDF p. 116: puede describirse como un registro de médicos asociados a una póliza, con nombre, especialidad, hospital e indicador de médico principal. No debe presentarse como un directorio clínico integrado ni como una validación automática de redes de proveedores si esas capacidades no están implementadas.
```

### 9.3 Estados funcionales

**Añade este párrafo después de las tablas de documentos, pagos y cambios de vida, y ajusta las etiquetas a la versión que se haya probado:**

```text
Los estados de documentos, pagos y cambios de vida pertenecen a procesos distintos y deben documentarse por separado. El backend define un conjunto de opciones para los documentos adjuntos, otro para el estado documental general de la póliza y otro para el seguimiento de pagos; por ello, no se debe presentar una única lista como si aplicara a todos los recursos. Para los cambios de vida, el modelo contempla estados de pendiente, en proceso, completado y cancelado. La interfaz puede mostrar traducciones o etiquetas descriptivas diferentes a los códigos almacenados, de modo que el diccionario debe incluir ambas formas cuando sea necesario y señalar cuál corresponde a la API. Antes de cerrar la tesis, conviene cotejar cada estado con el modelo, las migraciones, el serializador y la pantalla correspondiente.
```

---

## 10. Presentación, figuras y material que requiere confirmación

1. En las figuras de arquitectura, reemplaza elementos de reclamos, tarifas calculadas, microservicios, Redis, Celery o Docker por los componentes reales: frontend Next.js, API Django REST, base de datos configurada por ambiente, CRM interno, portal de clientes e integraciones documentadas.
2. En las figuras de flujo, utiliza el proceso de cotización y las etapas departamentales del expediente. No dibujes un flujo de “reclamo reportado → aprobado → pagado” como si perteneciera al producto.
3. En las capturas, evita mostrar datos personales reales. Utiliza datos ficticios de demostración sin reutilizar información identificable de clientes.
4. En la portada y páginas preliminares, verifica con la universidad cuál fecha y nombre de tutor o tutora son los oficiales; los valores que aparecen en el PDF no coinciden entre sí y no es posible determinar desde el repositorio cuál es el correcto.

## Referencias del repositorio para cotejar los textos

- [BACKEND_DOC.md](./BACKEND_DOC.md): modelos, API, integraciones y reglas del backend.
- [FRONTEND_DOC.MD](./FRONTEND_DOC.MD): rutas, CRM, portal de clientes y flujos de la interfaz.
- [GUIA_EMPLEADO_CRM.md](./GUIA_EMPLEADO_CRM.md): explicación operativa de cotizaciones, pólizas, cambios de vida y trabajo departamental.
- [backend/api/models.py](./backend/api/models.py): definición efectiva de entidades y estados.
- [backend/api/views.py](./backend/api/views.py): operaciones de pólizas, cotizaciones y cambios de vida.
- [backend/api/roles.py](./backend/api/roles.py): roles, departamentos y alcances.
- [backend/config/settings.py](./backend/config/settings.py): autenticación y selección de base de datos.
- [backend/api/encryption.py](./backend/api/encryption.py) y [backend/api/serializers.py](./backend/api/serializers.py): uso del cifrado en campos concretos.
- [frontend/package.json](./frontend/package.json) y [backend/requirements.txt](./backend/requirements.txt): versiones declaradas del stack.
