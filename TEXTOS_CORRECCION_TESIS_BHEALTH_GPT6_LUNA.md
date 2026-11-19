# Propuestas independientes de sustitución para la tesis sobre Bhealth

## Alcance de este documento

Las siguientes propuestas se redactaron como textos académicos independientes y listos para adaptar o copiar en la tesis. Cada bloque identifica el capítulo, la página del PDF y el tema o inicio del fragmento al que se refiere. El cotejo se limita a las funciones, arquitectura, datos y servicios que pueden comprobarse en el repositorio de Bhealth-Insurance.

La descripción resultante presenta a Bhealth como un CRM de agencia e intermediación de seguros, acompañado de un portal para clientes. No lo caracteriza como una aseguradora ni como un sistema central de operaciones aseguradoras. Los bloques no atribuyen al software tarificación actuarial, suscripción automatizada, emisión contractual por cuenta de una aseguradora o administración y liquidación de siniestros.

Se dejaron fuera los cuadros de encuesta, los resultados cuantitativos y las afirmaciones de rendimiento o rentabilidad. En el capítulo IV se proponen cambios únicamente para los pasajes de arquitectura, modelos, API e interfaz; no se propone sustituir ni reinterpretar las secciones de resultados medidos.

---

## Capítulo I. El problema y el alcance

### 1. Página PDF 10 — Planteamiento del problema

**Ubica el párrafo que comienza «Ante este escenario, surge la necesidad de desarrollar una solución tecnológica…» y sustituye la descripción de la plataforma y de su propósito por el texto siguiente:**

> Ante las necesidades operativas descritas, el proyecto se orienta al desarrollo y mantenimiento de una herramienta web para centralizar el trabajo de una agencia de seguros y facilitar la atención de su cartera. Bhealth funciona como un CRM de intermediación: organiza información de agencias, agentes, clientes y grupos familiares; mantiene expedientes de cotizaciones y pólizas; y reúne documentos, notas y actividades vinculadas con la gestión comercial y el servicio posterior a la afiliación. Su objetivo es apoyar al personal en la coordinación del expediente y en el seguimiento de sus tareas, no sustituir los portales de las aseguradoras o del Marketplace ni realizar las funciones propias de un sistema de administración central de una compañía aseguradora.
>
> La aplicación se compone de una interfaz web para el personal y una zona diferenciada para clientes, conectadas a través de una API. En el CRM, los usuarios autorizados pueden registrar y consultar la información pertinente a su función, tramitar el expediente por etapas departamentales y conservar su historial. En el portal, el cliente puede consultar información propia y enviar documentos o solicitudes habilitadas; la revisión y el procesamiento operativo corresponden al personal autorizado. La plataforma puede registrar datos de planes, primas, subsidios y pagos asociados al expediente, pero ese registro no debe confundirse con un cálculo actuarial, una decisión de elegibilidad, el cobro de una prima o la emisión jurídica de un contrato.

### 2. Página PDF 12 — Justificación técnica; párrafo sobre TaskUp y cálculo de primas

**Localiza el párrafo que comienza «Desde el punto de vista del desarrollo, el uso de tecnologías como Django/Python…» y reemplázalo por:**

> Desde el punto de vista del desarrollo, la solución emplea Django y Django REST Framework para exponer operaciones de backend, y Next.js, React y TypeScript para construir las interfaces web. La API permite que el CRM y el portal interactúen con los registros y operaciones autorizados, entre ellos clientes, agencias, agentes, productos, cotizaciones, pólizas, documentos y solicitudes de seguimiento. El software ofrece instrumentos para organizar la información del expediente y coordinar el trabajo de los usuarios; no incorpora, según la implementación revisada, un servicio denominado TaskUp ni un algoritmo que determine primas mediante una evaluación actuarial en tiempo real. Los importes de costo, subsidio y prima que se muestran en el expediente son datos registrados y administrados por la aplicación, por lo que su presencia no demuestra que el sistema los haya calculado.
>
> La justificación técnica de la propuesta se encuentra en integrar, en una misma herramienta, la información de los clientes y de sus grupos familiares, las cotizaciones y pólizas, los documentos y las actividades de atención. La aplicación mantiene una API común para los clientes web y organiza la autorización en el servidor. La carga y consulta de archivos, las notas, los recordatorios y el seguimiento por responsables facilitan la continuidad de la gestión. Las características de desempeño, disponibilidad y seguridad que dependen del entorno de despliegue deben describirse con base en el ambiente efectivamente utilizado y en evidencia de pruebas; no se deducen únicamente de la elección de un framework.

### 3. Páginas PDF 13–16 — Justificación tecnológica, privacidad y aporte operativo

**Sustituye los pasajes que atribuyen al producto PostgreSQL como única base, cifrado general de PII/PHI, cumplimiento de normas o una automatización total de la póliza por el bloque siguiente. Se pueden conservar las definiciones teóricas ajenas al sistema:**

> La solución desarrollada sigue una separación entre interfaz y servicios de aplicación. El backend está construido con Python, Django y Django REST Framework; el frontend utiliza Next.js, React y TypeScript. El frontend presenta las áreas del CRM y del portal de clientes, y consume recursos de la API para consultar y actualizar información. Los modelos y las reglas de acceso se mantienen en el backend. La persistencia se configura por ambiente: el proyecto puede conectarse a PostgreSQL mediante parámetros de configuración y cuenta, además, con una alternativa SQLite para desarrollo local. En consecuencia, la identificación de la base de datos de una instalación concreta debe corresponder al entorno empleado, sin atribuir una versión fija o una extensión no demostrada.
>
> El dominio de la aplicación comprende registros de agencias, agentes, clientes, grupos familiares, productos, aseguradoras, planes, cotizaciones y pólizas. En torno a esos registros se organizan documentos, notas, cambios de vida, pagos registrados, médicos y medicamentos asociados, citas, recordatorios y otras tareas de seguimiento. El sistema también mantiene información de actividad e historial, así como etapas para la revisión y transferencia de expedientes entre funciones departamentales. Estas capacidades respaldan la coordinación de la agencia; no equivalen a procesar suscripciones de riesgo, resolver reclamaciones médicas ni emitir contratos de seguro.
>
> Para autenticar a los usuarios, la aplicación utiliza JWT y perfiles con roles. La autorización se aplica a las operaciones y a la visibilidad de los datos según el perfil; la definición de roles distingue personal del CRM, usuarios básicos y clientes del portal. Entre los controles relacionados con expedientes se encuentran el historial de actividad, el registro de transferencias y mecanismos de presencia para limitar conflictos de edición. Tales controles deben describirse de manera concreta y no calificarse como inalterables, infalibles o suficientes por sí solos para acreditar el cumplimiento de una norma.
>
> El código cifra campos específicos de credenciales de portales y ciertos datos de tarjetas mediante Fernet, además de aplicar reglas de visualización para información sensible según el perfil. Esto no permite afirmar que todos los números de identificación, datos médicos o datos financieros estén cifrados de manera generalizada en la base de datos. Tampoco basta la existencia de autenticación, permisos o cifrado de campos para certificar cumplimiento de HIPAA, de la normativa venezolana o de estándares de seguridad. Toda afirmación de cumplimiento debe respaldarse mediante una evaluación técnica y jurídica independiente, delimitada al entorno y a las obligaciones aplicables.
>
> El aporte operativo del sistema consiste en concentrar la información del cliente y del expediente, ofrecer una vista compartida de las gestiones permitidas y facilitar el traspaso entre usuarios y departamentos. La aplicación registra quién crea o modifica determinados elementos y conserva información de actividad asociada al expediente. Esta trazabilidad apoya la supervisión interna, pero no sustituye un sistema regulatorio de registros aseguradores ni demuestra por sí misma la inmutabilidad de los datos o la eliminación de errores en los procesos externos.

### 4. Páginas PDF 17–19 — Delimitación tecnológica, aspectos excluidos y alcance

**Reemplaza la lista de componentes que incluye Celery/Redis y la sección que excluye el portal de clientes; ajusta también las referencias a primas, siniestros y contratación con el texto siguiente:**

> **Delimitación tecnológica.** El sistema comprende una aplicación web con frontend Next.js, React y TypeScript, y un backend Django que ofrece una API mediante Django REST Framework. La aplicación utiliza modelos relacionales y la configuración permite seleccionar el motor de base de datos conforme al ambiente: PostgreSQL cuando se proporcionan los parámetros correspondientes y SQLite como alternativa local. La autenticación se basa en JWT y los permisos se organizan mediante perfiles, roles y reglas por acción. El repositorio incluye módulos para el CRM, el portal de clientes, archivos, flujo departamental, auditoría de actividad y servicios complementarios documentados. No se debe incorporar Celery, Redis, una topología de microservicios, una extensión criptográfica de PostgreSQL ni una versión específica de TLS como componentes instalados sin evidencia del ambiente en que se ejecutó el sistema.
>
> **Alcance funcional.** La aplicación respalda la operación de intermediación de una agencia: administración de agencias y agentes, clientes y grupos familiares, catálogo de productos y planes, creación y seguimiento de cotizaciones, mantenimiento de expedientes de pólizas y coordinación de tareas entre departamentos. El expediente puede incluir datos registrados de primas y pagos, documentos, notas, recordatorios, citas, médicos, medicamentos y solicitudes por cambios de vida. El personal puede dar seguimiento a esos elementos mediante registros de actividad, asignaciones y transferencias.
>
> El portal del cliente forma parte de la solución y se mantiene separado del CRM interno. Con las credenciales y permisos correspondientes, el cliente accede a la información que le pertenece y puede utilizar las funciones habilitadas para enviar documentos o presentar solicitudes. El personal de la agencia conserva la responsabilidad de revisar y gestionar las solicitudes. El portal no reemplaza los servicios del Marketplace ni los sistemas de las compañías aseguradoras.
>
> **Límites funcionales.** El proyecto no debe describirse como un sistema de core asegurador, de suscripción actuarial o de emisión contractual automática. El código revisado no contiene un módulo de administración o liquidación de siniestros médicos. La aplicación registra información de cotizaciones, planes, pólizas y pagos para fines de gestión del expediente; esos registros no implican cálculo autónomo de tarifas, aprobación de cobertura, cobro directo ni ejecución de una transacción bancaria. Las acciones de inscripción, contratación, pago o atención que ocurran en plataformas externas deben atribuirse a esos servicios y no a Bhealth, salvo que se documenten y verifiquen integraciones concretas.

---

## Capítulo II. Marco teórico y descripción tecnológica

### 5. Páginas PDF 27–29 — Aplicación del concepto de CRM y embudo comercial

**En los pasajes que aplican al CRM la evaluación de riesgo, la emisión de pólizas y la gestión de siniestros, sustituye la explicación específica de Bhealth por:**

> En Bhealth, el CRM organiza las relaciones operativas de una agencia de intermediación con sus clientes y agentes. Su unidad de trabajo es el expediente asociado a una cotización o póliza, junto con los datos del titular y de los integrantes de su grupo familiar, los documentos, las notas y el seguimiento de actividades. La herramienta permite consultar y actualizar la información según los permisos del usuario, y coordinar determinadas etapas de revisión entre áreas de la agencia. En este contexto, una póliza es un registro de gestión asociado con información de mercado, producto, aseguradora, plan y cliente; su presencia en el CRM no significa que la aplicación la haya suscrito, emitido o modificado contractualmente.
>
> El recorrido documentado en el software debe explicarse como un flujo de atención y gestión, no como una cadena automatizada de evaluación de riesgo. Una persona o familia puede ser registrada en el CRM; el personal puede crear un expediente en estado de cotización, asociarlo con los datos disponibles del producto o plan, y posteriormente actualizarlo o transferirlo para revisión y gestión. Los datos de producto y de valores económicos se conservan como información del expediente. La decisión sobre elegibilidad, la selección definitiva del producto, la formalización del seguro y las acciones ejecutadas en portales de terceros no deben presentarse como decisiones que toma automáticamente Bhealth.
>
> Tampoco se debe atribuir a Bhealth un módulo para recibir y resolver reclamaciones, autorizar procedimientos, calcular indemnizaciones o liquidar siniestros. La solución contiene herramientas de servicio y seguimiento posterior a la afiliación —como cambios de vida, documentos, citas, notas, médicos, medicamentos y recordatorios— que ayudan a la agencia a atender su cartera. Esas funciones son distintas de la administración de reclamaciones por parte de una aseguradora.

### 6. Páginas PDF 29–30 — Descripción de API y cuadro de endpoints

**Sustituye la aplicación de operaciones REST que menciona la creación de registros de siniestros y el cuadro con rutas que no coincidan con el proyecto por el texto siguiente:**

> El backend expone una API con Django REST Framework bajo la raíz de servicio configurada como `/api/`. A través de ella, el frontend solicita operaciones sobre los recursos del CRM y del portal: autenticación, usuarios y perfiles, agencias, agentes, clientes, productos, planes, pólizas, documentos, notas, tareas, citas, recordatorios, cambios de vida, pagos registrados, consentimiento y otros datos administrativos. La API aplica serializadores y permisos para validar las entradas y limitar las acciones a usuarios autorizados.
>
> En términos generales, las consultas recuperan registros y listas; las operaciones de creación incorporan nuevos elementos a los expedientes; y las operaciones de actualización modifican atributos permitidos. Algunas acciones se implementan como operaciones específicas, por ejemplo, las transferencias de etapa de una póliza, la gestión de presencia durante la edición o las acciones del portal del cliente. El uso de métodos HTTP no implica que existan recursos para cotización actuarial, emisión automatizada o siniestros. La relación definitiva de endpoints, métodos y permisos debe transcribirse desde las rutas actuales del backend para la versión evaluada, en lugar de conservar rutas ilustrativas que no correspondan a la API vigente.

### 7. Páginas PDF 31–34 — Backend, base de datos, cifrado y cumplimiento

**Reemplaza las secciones que describen PostgreSQL 16 como fuente única, el cifrado general de SSN/PHI y el cumplimiento incorporado de HIPAA por:**

> El backend utiliza Django y Django REST Framework para definir modelos, validar datos recibidos, serializar recursos y aplicar permisos a las operaciones de la API. Su configuración permite conectar la aplicación con PostgreSQL cuando el entorno proporciona una URL de conexión o variables de base de datos; cuando no existe esa configuración, se contempla SQLite como alternativa local. Por ello, no se debe presentar una única versión de PostgreSQL como propiedad intrínseca del sistema: la tesis debe identificar el motor usado en la instalación que describe, si ese dato se conoce.
>
> El esquema de datos incluye entidades para agencias, direcciones, agentes, clientes, aseguradoras, tipos de producto, planes, pólizas y relaciones entre pólizas y clientes. Además, existen modelos de documentos y carpetas, notas, historial, cambios de vida, información de pago, tarjetas, citas, recordatorios, tareas, perfiles de usuario, transferencias y registros de auditoría. El diseño representa información de gestión de una agencia y de sus expedientes; no contiene una entidad de siniestros o reclamaciones que sustente la descripción de un módulo de liquidación.
>
> La autenticación usa JWT con perfiles y roles de usuario, y el backend mantiene permisos diferenciados para funciones del CRM y del portal. La visibilidad de algunas operaciones y datos varía según el rol y la relación del usuario con la agencia, el agente o el cliente. La implementación incluye protección de acceso, pero la redacción académica debe evitar conclusiones absolutas sobre invulnerabilidad, confidencialidad total o cumplimiento legal automático.
>
> El mecanismo Fernet se utiliza para proteger campos concretos que incluyen credenciales de determinados portales y datos de tarjetas gestionados por los serializadores. Otros atributos, entre ellos el SSN del cliente, aparecen como campos ordinarios del modelo y no deben describirse como cifrados de forma general por Fernet. La aplicación también puede enmascarar información para algunos perfiles. Estas medidas deben exponerse con su alcance real y no como un programa integral de protección de todos los datos personales o de salud.
>
> La referencia a HIPAA u otras obligaciones regulatorias debe mantenerse en el marco jurídico o de buenas prácticas únicamente como análisis del marco que podría resultar aplicable. La existencia de JWT, permisos, auditoría o cifrado selectivo no certifica que el software cumpla con HIPAA ni con una legislación particular. Para afirmar cumplimiento se requiere una evaluación independiente que abarque la organización, las políticas, el despliegue, los contratos, el tratamiento de datos y los controles técnicos pertinentes.

### 8. Páginas PDF 35–40 — Frontend, rutas y garantías de accesibilidad

**Ajusta los pasajes que presentan la aplicación como una herramienta para procesar reclamos o que afirman cumplimiento de accesibilidad únicamente por emplear HTML semántico. Puedes sustituir la aplicación del frontend al proyecto por:**

> El frontend está construido con Next.js, React y TypeScript. Sus páginas separan el área interna del CRM y el portal del cliente, y consumen la API para mostrar o actualizar información permitida. En el área de empleados se encuentran vistas de clientes, cotizaciones, pólizas, usuarios, citas y paneles de gestión; el portal presenta una experiencia diferenciada para clientes. Las rutas y capacidades deben describirse según las pantallas presentes en la versión examinada y no como módulos de suscripción, siniestros o emisión de documentos contractuales que no se encuentren implementados.
>
> La interfaz proporciona componentes y formularios para consultar expedientes y registrar acciones operativas. La autenticación del frontend se integra con los tokens del backend y utiliza mecanismos de sesión y control de navegación para separar las áreas de clientes y empleados. Las reglas decisivas de autorización corresponden al servidor; ocultar una opción en la interfaz no debe presentarse como sustituto de los permisos de la API.
>
> La estructura visual o el uso de elementos HTML semánticos pueden contribuir a la usabilidad y a la accesibilidad, pero no bastan para afirmar conformidad con WCAG ni para certificar la accesibilidad de todo el producto. Si la tesis desea atribuir esa conformidad, debe identificar una auditoría, el criterio aplicado, las páginas revisadas y sus resultados; de lo contrario, conviene limitarse a describir el diseño de la interfaz y sus características observables.

### 9. Páginas PDF 41–42 — Entidades y flujo departamental

**Sustituye las referencias a coberturas, suscripción, reclamaciones y la máquina de emisión por la descripción siguiente:**

> El modelo de información conecta los registros de la agencia con las actividades de intermediación y servicio al cliente. La entidad Agencia agrupa datos de la organización y se relaciona con agentes; el registro de Cliente conserva información de una persona y puede vincularse con uno o varios expedientes. La entidad Poliza se relaciona con clientes mediante una entidad intermedia que registra la participación y la condición del titular o aplicante, y enlaza información de producto, plan, aseguradora, agente, estado, fechas y valores incorporados al expediente. Los tipos de producto y los planes se mantienen como datos relacionados; no se modela un catálogo de coberturas que permita al software calcular beneficios contractuales.
>
> El sistema diferencia el estado comercial de la cotización o póliza de la etapa de trabajo departamental. Al crear un registro sin un estado explícito, el backend puede asignar un estado de cotización disponible; la vista ordinaria de pólizas separa esos registros de las pólizas en curso. En paralelo, el flujo interno contempla las etapas de captura por Client Support, revisión de coordinación o manager, gestión de Health Sherpa, devolución a captura y cierre de la etapa del Sherpa. Las transferencias registran usuarios, roles, acción, nota e historial asociado.
>
> El recorrido anterior es un mecanismo interno de asignación y seguimiento del expediente. No representa una máquina que determine el riesgo de un solicitante, apruebe una cobertura, contrate con una aseguradora o procese una reclamación. Los permisos para las transiciones se aplican de acuerdo con el rol y la matriz correspondiente. La tesis debe describirlo como un flujo de trabajo de agencia, y no como el ciclo contractual completo de una póliza de seguro.

### 10. Páginas PDF 43–45 — Infraestructura, despliegue y stack

**En los cuadros o pasajes que declaran Redis, Celery, contenedores o servicios de nube como parte instalada del producto, utiliza esta formulación y distingue los procedimientos de despliegue documentados de la configuración efectivamente evaluada:**

> La arquitectura de la aplicación está formada por un frontend Next.js y un backend Django REST que se comunican mediante la API. El repositorio incluye dependencias de Django REST Framework, autenticación JWT, conectividad con PostgreSQL y compatibilidad local con SQLite. También contiene documentación de despliegue para escenarios que emplean Gunicorn y Nginx, así como instrucciones para otros proveedores y entornos. Estos documentos describen alternativas operativas; por sí solos no prueban qué configuración se utilizó en una instalación específica.
>
> La tesis debe diferenciar los componentes de software presentes en el repositorio de los servicios que podrían incorporarse en producción. No se identifican como dependencias del sistema Celery ni Redis, y no se debe describir la aplicación como un conjunto de microservicios por el hecho de separar el frontend del backend. La separación corresponde a una arquitectura web cliente-servidor con una API. El sistema operativo, la base de datos, el proxy, el servidor de aplicaciones, el proveedor de alojamiento, el certificado y la topología deben consignarse únicamente cuando se hayan verificado para el entorno de ejecución al que se refiere el trabajo.

---

## Capítulo III. Marco metodológico y requerimientos

### 11. Página PDF 52 — Aplicación de la metodología al sistema

**En el párrafo que presenta microservicios, Redis, optimización de consultas y procesamiento de siniestros como propiedades evaluadas de Bhealth, sustituye la aplicación al proyecto por:**

> En el contexto de este trabajo, el objeto de estudio es una aplicación web para la gestión de una agencia de intermediación de seguros. La solución observada se organiza en un frontend basado en Next.js, React y TypeScript, y un backend basado en Django REST Framework, con modelos relacionales y permisos por usuario. El análisis del sistema debe concentrarse en sus procesos comprobables: registro de agencias, agentes y clientes; organización de cotizaciones y pólizas; gestión documental; flujo departamental; portal de clientes; y herramientas de seguimiento de solicitudes y actividades.
>
> La caracterización metodológica de la propuesta puede examinar la correspondencia entre esos requisitos y las funciones efectivamente implementadas. No se debe inferir la existencia de una arquitectura de microservicios, caché Redis, tareas Celery, procesamiento de siniestros o automatización tarifaria a partir del uso de una API REST, un ORM o frameworks web. Cuando se evalúen aspectos de latencia, rendimiento o calidad, deben tratarse en las secciones metodológicas y de resultados pertinentes, con su propio procedimiento y evidencia, sin convertirlos en características supuestas del código.

### 12. Páginas PDF 77–80 — Requerimientos de software y recursos

**Reemplaza las listas que presentan como requisitos instalados tecnologías o versiones no confirmadas, y deja los recursos físicos como requerimientos de un ambiente propuesto solo si se cuenta con una especificación aprobada. Texto sugerido:**

> **Requerimientos de software de la aplicación.** El backend está implementado con Python, Django y Django REST Framework; el frontend emplea Next.js, React, TypeScript, Tailwind CSS y Zustand. La comunicación entre ambos componentes se realiza a través de una API que intercambia datos estructurados. La autenticación utiliza JWT y el servidor aplica permisos asociados a perfiles y roles. La configuración admite una base PostgreSQL cuando se proporcionan los parámetros de conexión y contempla SQLite para desarrollo local. La versión concreta de cada motor y servicio debe registrarse de acuerdo con el ambiente de ejecución utilizado en la evaluación.
>
> La documentación de despliegue contempla servidores de aplicación y proxy inverso para algunos escenarios, así como configuraciones alternativas de publicación. La tesis debe identificar qué procedimiento se llevó a cabo y separar las herramientas propuestas para una futura instalación de las que efectivamente se utilizaron. No deben listarse Docker, Redis, Celery, extensiones de cifrado de base de datos o versiones de seguridad de transporte como componentes implantados sin evidencia correspondiente.
>
> **Requerimientos de hardware y conectividad.** Las necesidades de hardware dependen de la cantidad de usuarios, volumen de archivos, base de datos, proveedor de alojamiento y políticas de respaldo del ambiente escogido. Si no existe una ficha técnica validada para la instalación evaluada, esta sección debe presentarse como una estimación de planificación y no como una especificación comprobada del sistema. El acceso desde dispositivos se realiza mediante la aplicación web en un navegador; no se trata de una aplicación móvil nativa.

---

## Capítulo IV. Análisis y presentación de los resultados — solo pasajes técnicos

### 13. Páginas PDF 84–85 — Descripción de la solución y arquitectura

**Sustituye los párrafos que anuncian automatización integral, emisión inmediata de PDF, cotización por riesgo y liquidación de reclamos. Este bloque se limita a la descripción funcional y técnica de estas páginas:**

> La solución construida es una aplicación web que apoya la operación interna de una agencia de seguros y ofrece un portal diferenciado para sus clientes. El CRM concentra la gestión de agencias, agentes, clientes y grupos familiares, junto con expedientes de cotizaciones y pólizas. Sobre estos expedientes, los usuarios autorizados pueden registrar información del producto, del plan y de la aseguradora; organizar archivos y notas; dar seguimiento a solicitudes y tareas; y transferir el trabajo entre etapas departamentales. La aplicación mantiene además herramientas de servicio vinculadas con cambios de vida, citas, recordatorios, médicos, medicamentos y datos de pago registrados.
>
> La solución no automatiza el proceso completo de contratación del seguro. El sistema puede crear un expediente en estado de cotización y mantener información recibida o incorporada por los usuarios, pero no calcula una prima actuarial a partir de variables de salud ni determina la elegibilidad o cobertura. Tampoco se comprobó un módulo de siniestros, de aprobación de gastos médicos o de liquidación de reclamaciones. Los contratos celebrados con una aseguradora y las acciones realizadas en los portales externos corresponden a esos procesos y sistemas, no a una emisión contractual efectuada por el CRM.
>
> **Arquitectura de la aplicación.** El navegador presenta una interfaz Next.js construida con React y TypeScript. El área `/crm` está destinada al personal de la agencia y la zona `/client` ofrece acceso separado a los clientes. Ambas áreas consumen servicios del backend Django REST a través de la API. El backend contiene los modelos, serializadores, validaciones y permisos; la base de datos se selecciona mediante la configuración del ambiente. Esta arquitectura describe dos componentes principales de una aplicación web desacoplada, no una plataforma de microservicios. La escalabilidad horizontal, la alta disponibilidad y la tolerancia a fallos dependerían de infraestructura y pruebas adicionales y no se deben afirmar solo a partir de esta separación.

### 14. Páginas PDF 85–88 — Diccionario de datos, endpoints y pantallas

**Reemplaza los cuadros de entidades de póliza y siniestros, los ejemplos de API que atribuyen cálculos automáticos y las leyendas de pantallas de reclamaciones por este texto:**

> **Modelo de datos del CRM.** El modelo principal relaciona agencias, agentes, clientes, grupos familiares, productos, aseguradoras, planes y expedientes de póliza. El registro de póliza almacena identificadores de mercado y de miembro, costos, subsidios, prima mensual, estado, fechas, tipo de producto, plan, aseguradora, agentes y relaciones con los clientes que participan en el expediente. Los campos económicos representan valores almacenados en el sistema; su existencia no significa que una regla actuarial los haya calculado.
>
> Alrededor del expediente, el sistema organiza documentos y carpetas, notas y adjuntos, historial de cambios, transferencias departamentales, tareas, cambios de vida, recordatorios, citas, información de médicos y medicamentos, e información de pago. La relación entre póliza y cliente permite indicar participantes, solicitante principal y tipo de relación. Los perfiles de usuario registran rol, estado y, cuando corresponde, vínculo con un agente o cliente. Estos modelos describen procesos de gestión y servicio de una agencia, y no entidades de cobertura actuarial, siniestro o reclamación.
>
> **API.** Los ejemplos de solicitud y respuesta deben tomarse de las rutas y serializadores existentes. La API permite crear y actualizar expedientes y recursos de apoyo de acuerdo con permisos; las acciones de flujo modifican la etapa departamental y registran una transferencia. La creación de una cotización no constituye un cálculo de prima, y una respuesta HTTP correcta no equivale a aprobación de cobertura o emisión de un contrato. Deben eliminarse de los ejemplos las rutas, atributos y respuestas de siniestros o de cálculo de primas si no corresponden a las operaciones vigentes.
>
> **Interfaz.** Las capturas y leyendas deben mostrar pantallas del CRM y del portal existentes: vistas de cotizaciones y pólizas, datos del cliente y su grupo familiar, documentos, notas, recordatorios, citas, cambios de vida, actividades y herramientas de coordinación. Una pantalla de seguimiento interno no debe titularse como panel de reclamaciones ni presentarse como mecanismo para aprobar o pagar prestaciones médicas. Las leyendas deben identificar si se trata de una vista de empleados o del portal de clientes y describir únicamente la acción observable.

---

## Capítulo VI. La propuesta

### 15. Páginas PDF 96–97 — Denominación, objetivo y beneficiarios

**Sustituye la denominación y los objetivos que ofrecen suscripción, cotización actuarial, emisión y liquidación. Para evitar intervenir en resultados, no reemplaces en este documento el apartado «Metas del Proyecto».**

> **Denominación del proyecto.** Desarrollo de una aplicación web CRM para la gestión operativa de una agencia de seguros y un portal de atención a clientes de Bhealth Insurance.
>
> **Objetivo general de la propuesta.** Describir y consolidar una aplicación web que centraliza la información de agencias, agentes, clientes y grupos familiares, y facilita la gestión de cotizaciones, expedientes de pólizas, documentación y seguimiento de la atención mediante un CRM interno y un portal de clientes.
>
> **Objetivos específicos de la propuesta.**
>
> 1. Organizar los registros de agencias, agentes, clientes, grupos familiares, tipos de producto, aseguradoras, planes, cotizaciones y pólizas en modelos relacionados.
> 2. Proporcionar una interfaz para que el personal autorizado consulte y administre los expedientes conforme a sus funciones y permisos.
> 3. Apoyar la coordinación interna mediante etapas departamentales, registro de transferencias, historial, notas, documentos, tareas y recordatorios.
> 4. Ofrecer un portal separado para que los clientes consulten su información y utilicen las funciones disponibles para presentar solicitudes o adjuntar documentos, sujetos a revisión del personal.
> 5. Describir las operaciones, los límites del sistema y los servicios externos utilizados sin atribuir a la aplicación decisiones de suscripción, cálculo actuarial, contratación, cobro o liquidación de siniestros.
>
> **Beneficiarios de la propuesta.** Los beneficiarios directos son los usuarios de la agencia que gestionan clientes, expedientes y actividades: personal de coordinación, soporte, agentes, Health Sherpa y otros perfiles operativos. La plataforma reúne información que dichos usuarios necesitan para atender y transferir los expedientes dentro de las funciones autorizadas. Los clientes son beneficiarios del portal porque pueden consultar información propia y remitir los elementos habilitados para atención. La aplicación facilita la organización y comunicación de la agencia; no promete aprobación inmediata de cobertura, emisión de carnets, respuesta automática a solicitudes ni liquidación de gastos médicos.

### 16. Páginas PDF 101–116 — Diagrama entidad-relación y diccionario de datos

**Sustituye las tablas o descripciones que incluyan `Siniestro`, cobertura calculada, prima determinada por riesgo, emisión contractual u otros campos que no existan en los modelos. El siguiente texto puede servir como explicación introductoria al diagrama y al diccionario reconstruidos a partir del código:**

> **Modelo conceptual de datos.** El esquema de Bhealth representa la operación de una agencia de intermediación. Agencia reúne los datos de identificación y configuración de la organización; Agente se vincula con una agencia y conserva datos profesionales como NPN y FFM; Cliente mantiene la información de la persona y puede estar asociado con el agente responsable. Direcciones se reutiliza para domicilios de clientes, agencias y pólizas. Aseguradora, TipoProducto y Plan organizan el catálogo comercial que el personal utiliza al documentar los expedientes.
>
> Poliza representa el expediente de gestión y se relaciona con un tipo de producto, una aseguradora, un plan, uno o más agentes y uno o varios clientes por medio de PolizaCliente. Esta relación intermedia identifica la participación de cada cliente, si corresponde al solicitante principal y su vínculo con el grupo familiar. El registro conserva identificadores externos, estado, fechas, datos de plan y valores económicos informados. No debe interpretarse como una entidad que calcule la tarifa, el beneficio o la elegibilidad del seguro.
>
> Las funciones documentales se representan mediante Documento, CarpetaDocumento y Etiqueta, asociados al expediente y, cuando corresponde, a un cliente. Nota y sus adjuntos permiten conservar comentarios del personal; HistorialPoliza y PolizaTransferencia documentan acciones y movimientos de etapa; Tarea y Recordatorio apoyan la asignación y seguimiento de actividades. CambioDeVida registra solicitudes o eventos como modificaciones de dirección, ingresos, situación migratoria o composición familiar. Estos objetos sirven para ordenar la atención y no implican que el sistema actualice automáticamente el contrato frente a una aseguradora.
>
> Otros registros apoyan la continuidad del servicio: InfoPago mantiene información del estado y calendario de pago asociado al expediente; CuentaBancaria y TarjetaCredito representan datos de medios de pago registrados; Cita organiza citas asociadas a clientes y pólizas; MedicoPoliza y Medicamento mantienen información de profesionales o medicamentos vinculados con el expediente. La existencia de estos registros no acredita que el software ejecute cobros, gestione prestaciones médicas o autorice tratamientos. El diagrama debe reflejar las relaciones reales definidas por las claves foráneas y las tablas intermedias del código.
>
> Los perfiles y controles de acceso se apoyan en UserProfile, Departamento y MatrizPermisoRol, junto con los roles definidos en el backend. AuditoriaGlobal y el historial de la póliza almacenan información de actividad; PolizaViewer y los mecanismos de presencia respaldan la coordinación durante la consulta o edición. En el modelo no se identificó una clase `Siniestro` o `Reclamo` que sostenga el diccionario presentado en la tesis. Si se conserva un esquema futuro de reclamaciones, debe separarse claramente del modelo implementado y rotularse como propuesta, no como estructura existente.

### 17. Páginas PDF 106–116 — Contratos, firma electrónica y servicios externos

**Si la tabla o el texto de estas páginas describe a Zoho Sign como mecanismo de emisión de pólizas, reemplázalo por:**

> La integración con Zoho Sign se utiliza en el flujo de firma electrónica de contratos de agentes. El sistema permite gestionar el documento, enviarlo al servicio externo y recibir información de seguimiento mediante las operaciones y notificaciones configuradas. La firma de un contrato de agente no equivale a la emisión de una póliza ni constituye evidencia de que la aplicación formalice contratos de seguros en nombre de una aseguradora.
>
> El repositorio también contiene servicios complementarios, como la consulta de información geográfica a partir de un código postal, la gestión de solicitudes de consentimiento y enlaces de navegación hacia recursos externos relacionados con el mercado de seguros. En cada caso debe distinguirse una integración que intercambia información con otro servicio de un enlace que simplemente abre una página externa. No se debe afirmar que Bhealth realiza una inscripción automática en el Marketplace, modifica registros externos o sincroniza datos con una aseguradora si el flujo específico no está implementado y comprobado.

---

## Referencias internas para cotejo

Las propuestas se contrastaron principalmente con los modelos y reglas de `backend/api/models.py`, `backend/api/roles.py`, `backend/api/views.py`, `backend/api/urls.py`, `backend/api/views_portal_cliente.py`, `backend/api/permissions.py`, `backend/api/encryption.py`, `backend/api/serializers.py` y `backend/config/settings.py`. Para la interfaz y los flujos se consultaron `frontend/package.json`, las rutas del frontend, `BACKEND_DOC.md`, `FRONTEND_DOC.MD`, `GUIA_EMPLEADO_CRM.md`, `roles.md`, `README.md` y la documentación de despliegue.

La tesis y los documentos fuente pueden corresponder a versiones diferentes. Antes de pegar estos bloques, conviene verificar las etiquetas visibles y las funciones activas en la versión que se presentará ante la universidad. Este documento no modifica la tesis ni reemplaza la revisión del asesor sobre aspectos metodológicos, jurídicos o de formato.
