# Guion para la defensa del trabajo de grado

**Duración total:** 15 minutos  
**Distribución:** 6 minutos y 45 segundos para el trabajo de grado, 7 minutos para presentar el sistema mediante capturas y 1 minuto y 15 segundos para conclusiones.  
**Tema:** Desarrollo de un sistema centralizado para apoyar la gestión operativa de BHealth Insurance.

> **Criterio para esta defensa:** el guion describe BHealth Insurance / Lumina CRM como una herramienta de gestión para una agencia de seguros y su portal de clientes. El sistema ayuda a organizar clientes, cotizaciones, pólizas, documentos y flujos internos. No se debe afirmar que calcula automáticamente primas con reglas actuariales, emite contratos o pólizas oficiales, liquida siniestros, garantiza tiempos de respuesta determinados o cumple por sí solo con HIPAA. Si la versión final de la tesis todavía incluye esas afirmaciones, corregirlas antes de la exposición.

## Cronograma resumido

| Tiempo | Sección | Apoyo visual |
|---|---|---|
| 00:00–00:45 | Saludo y presentación del tema | Portada |
| 00:45–02:15 | Contexto y problema | Diapositiva de situación problemática |
| 02:15–03:15 | Objetivo y alcance | Diapositiva de objetivos |
| 03:15–04:30 | Justificación y delimitación | Diapositiva de aportes y alcance |
| 04:30–05:30 | Enfoque metodológico | Diapositiva de metodología |
| 05:30–06:45 | Solución y arquitectura | Diagrama real de arquitectura |
| 06:45–07:30 | Captura 1: Dashboard | Dashboard del CRM |
| 07:30–08:35 | Captura 2: Pólizas y cotizaciones | Listas del CRM |
| 08:35–09:40 | Captura 3: Expediente de póliza | Detalle de una póliza ficticia |
| 09:40–10:45 | Captura 4: Flujo operativo | Historial o sección de flujo |
| 10:45–11:40 | Captura 5: Documentos y seguimiento | Sección de documentos |
| 11:40–12:35 | Captura 6: Portal del cliente | Dashboard del portal |
| 12:35–13:45 | Captura 7: Roles y arquitectura | Pantalla de usuarios/permisos y diagrama |
| 13:45–15:00 | Conclusiones y cierre | Diapositiva final |

---

## Guion detallado

### 00:00–00:45 | Saludo y presentación

**[Diapositiva 1: portada de la tesis]**

> Buenos días/tardes, miembros del jurado, tutora y asistentes. Mi nombre es Jerome Rojas y presentaré mi trabajo de grado titulado **“Desarrollo de un sistema centralizado de agencias de seguros y procesos de afiliación para la empresa BHealth Insurance”**.
>
> En estos quince minutos expondré la necesidad que motivó el proyecto, su objetivo y enfoque de desarrollo, y luego mostraré, mediante capturas, cómo el sistema apoya la operación diaria de la agencia y la interacción con sus clientes.

### 00:45–02:15 | Contexto y problema

**[Diapositiva 2: problema y contexto operativo]**

> La gestión de una agencia de seguros involucra información de clientes y sus familias, cotizaciones, pólizas, documentos y actividades que pueden pasar por distintas personas o departamentos. Cuando esos datos se mantienen en medios separados o en procesos manuales, resulta más difícil localizar la información, conocer el estado de cada expediente y dar continuidad al trabajo.
>
> En el contexto de BHealth Insurance, el proyecto se planteó para centralizar esos registros y facilitar la coordinación entre el personal que atiende la cartera. La necesidad principal no consiste en reemplazar las decisiones de una aseguradora ni en automatizar la determinación contractual de una cobertura, sino en ofrecer una herramienta que organice la información operativa de la agencia, permita dar seguimiento a cotizaciones y pólizas y mantenga documentadas las acciones realizadas sobre los expedientes.
>
> A partir de esta situación, la pregunta que guía el trabajo es cómo desarrollar un sistema web que apoye de manera centralizada la gestión de la agencia y de los procesos asociados a la afiliación.

### 02:15–03:15 | Objetivo y alcance

**[Diapositiva 3: objetivo general y objetivos específicos]**

> El objetivo general fue desarrollar un sistema web para la administración centralizada de las agencias y los procesos de afiliación de BHealth Insurance.
>
> Para alcanzar ese objetivo se consideraron el análisis de los flujos operativos, la definición de requerimientos, el diseño de la arquitectura y de la interfaz, y la implementación de funciones para organizar clientes, cotizaciones, pólizas y expedientes.
>
> El alcance se centra en el apoyo a la operación de una agencia: registrar y consultar información, coordinar tareas y transferencias internas, y permitir al cliente acceder a un portal separado. El sistema no sustituye los portales oficiales de las aseguradoras o del Marketplace ni procesa por sí mismo la liquidación de siniestros.

### 03:15–04:30 | Justificación y delimitación

**[Diapositiva 4: justificación y beneficiarios]**

> La importancia del proyecto es práctica y tecnológica. En el plano operativo, disponer de información centralizada ayuda al equipo a consultar el expediente y comprender en qué etapa se encuentra el trabajo. En el plano tecnológico, se implementó una aplicación web con una interfaz separada de una API, lo cual organiza las responsabilidades del cliente y del servidor.
>
> Entre sus usuarios se encuentran los empleados con distintos roles y departamentos, así como los clientes que utilizan el portal. La información visible y las acciones disponibles dependen del acceso configurado para cada usuario.
>
> Es importante delimitar lo que se demuestra: el CRM registra y acompaña datos de cotizaciones y pólizas, pero no es un motor actuarial que determina automáticamente las primas ni una plataforma de core asegurador que emite contratos. De igual manera, la presencia de controles de acceso o de registros de actividad no equivale por sí sola a una certificación de cumplimiento legal o de seguridad.

### 04:30–05:30 | Enfoque metodológico

**[Diapositiva 5: metodología]**

> En el documento, el trabajo se plantea como una investigación aplicada y tecnológica, orientada a elaborar una solución para una necesidad organizacional concreta. También se describe como un proyecto factible, con un abordaje descriptivo y de campo, no experimental y transversal.
>
> Desde el punto de vista del desarrollo, el trabajo comprendió el reconocimiento del contexto operativo, la identificación de necesidades, el diseño de la solución y la construcción de una aplicación funcional. Para la defensa presentaré las funciones que pueden observarse en el sistema, evitando atribuirles cifras de rendimiento o resultados cuantitativos que no estén sustentados por mediciones verificables.

### 05:30–06:45 | Solución y arquitectura

**[Diapositiva 6: diagrama de arquitectura del repositorio]**

> La solución se compone de una interfaz web para el personal y un portal diferenciado para clientes. El frontend está construido con Next.js, React y TypeScript. Se comunica mediante una API REST desarrollada con Django y Django REST Framework, que accede a una base de datos relacional configurada según el entorno.
>
> El sistema incorpora autenticación con tokens, permisos asociados a roles y funciones de auditoría e historial para apoyar el control y la trazabilidad de la operación. También contempla controles para reducir conflictos cuando varias personas trabajan sobre un expediente.
>
> A continuación, mostraré una secuencia breve de capturas. En cada una señalaré qué tarea apoya el sistema y qué parte del flujo queda bajo responsabilidad del equipo de la agencia.

---

## Demostración del sistema mediante capturas

> **Preparación:** usar capturas tomadas de una cuenta de demostración, con nombres, correos, identificadores y documentos ficticios o debidamente anonimizados. Mantener el mismo expediente de demostración entre las capturas cuando sea posible. No mostrar claves, tokens, números de identificación, información médica real ni datos financieros.

### 06:45–07:30 | Captura 1: Dashboard del CRM

**[Mostrar captura 1: `/crm/dashboard`]**

> Esta es la pantalla principal del CRM. El dashboard ofrece una vista general de la información operativa registrada, como pólizas, aplicantes, recordatorios u otros indicadores disponibles según el perfil de acceso.
>
> Su propósito es facilitar una consulta inicial del estado de la cartera. Los valores que aparecen aquí dependen de los datos cargados; no los presentaré como resultados de una medición experimental del trabajo.

**Preparar:** abrir el dashboard con datos ficticios consistentes y sin información personal visible.

### 07:30–08:35 | Captura 2: Pólizas y cotizaciones

**[Mostrar captura 2A: lista de pólizas; luego captura 2B: lista de cotizaciones]**

> En el módulo de pólizas, el personal consulta los expedientes que corresponden a su acceso. Las cotizaciones se encuentran en una sección separada porque representan registros en preparación, antes de pasar al flujo de póliza.
>
> Esta separación ayuda al equipo a distinguir los expedientes que todavía requieren completar o revisar información de aquellos que ya están siendo gestionados como pólizas. El sistema sirve para dar seguimiento y organizar el trabajo; no realiza por sí solo la suscripción ni confirma la cobertura con la aseguradora.

**Preparar:** elegir capturas donde se vean los encabezados y estados sin exponer datos reales.

### 08:35–09:40 | Captura 3: Expediente de una póliza

**[Mostrar captura 3: detalle de una póliza de demostración]**

> Al entrar en un expediente, el usuario puede consultar información relacionada con el cliente, el grupo familiar, el plan y otros datos del registro. Según los permisos y la configuración, también puede revisar secciones como documentos, notas, pagos, contactos o actividad.
>
> La utilidad es mantener reunida información que, de otro modo, podría quedar distribuida entre varias herramientas. Los importes o valores de prima que se muestren son datos registrados en el expediente; no deben describirse como el resultado de un cálculo actuarial automático, salvo que se haya incorporado y validado explícitamente un módulo de ese tipo.

**Preparar:** mostrar un expediente con datos inventados; si hay muchas pestañas, usar una captura general y otra de una sección clave.

### 09:40–10:45 | Captura 4: Flujo de trabajo entre áreas

**[Mostrar captura 4: sección Flujo o historial de transferencias]**

> Esta sección muestra cómo puede coordinarse el trabajo de una póliza entre distintos responsables. En el flujo documentado, una persona puede revisar el expediente y transferirlo para que otro rol o departamento continúe con las tareas que le corresponden. El historial permite consultar las transferencias y la actividad asociada.
>
> El objetivo es que el equipo pueda identificar quién debe continuar el trabajo y qué acciones se han registrado. La inscripción o la confirmación final que dependa de plataformas externas sigue realizándose en los sistemas correspondientes.

**Preparar:** usar un expediente de demostración con historial no sensible; verificar las etiquetas mostradas en la versión instalada.

### 10:45–11:40 | Captura 5: Documentos y seguimiento

**[Mostrar captura 5: pestaña de documentos del expediente]**

> El expediente también permite organizar documentos y consultar su seguimiento. El personal puede ubicar los archivos relacionados con el cliente o la póliza y asociarlos con la gestión correspondiente.
>
> Esta función facilita la consulta centralizada, pero la captura no implica que el sistema emita automáticamente contratos oficiales ni que liquide reclamos. Tampoco se deben mostrar documentos auténticos; para la presentación usar archivos de prueba.

**Opcional:** si la sección de documentos no está disponible en el entorno de presentación, reemplazar esta captura por la vista de notas o historial de actividad, sin alterar el tiempo asignado.

### 11:40–12:35 | Captura 6: Portal del cliente

**[Mostrar captura 6: `/client/dashboard`]**

> Además del CRM para empleados, existe un área separada para clientes. Desde el portal, el cliente puede consultar la información propia que el sistema le habilita y, de acuerdo con las funciones disponibles, iniciar solicitudes o entregar documentación.
>
> Esto no significa que el cliente tenga acceso a las herramientas internas del CRM. La separación entre ambos espacios ayuda a presentar una experiencia distinta para el personal y para los usuarios finales.

**Preparar:** capturar el portal con una cuenta ficticia. No mostrar credenciales ni enlaces de activación.

### 12:35–13:45 | Captura 7: Roles y resumen técnico

**[Mostrar captura 7A: usuarios/roles o permisos; después 7B: diagrama sencillo de frontend–API–base de datos]**

> Para finalizar el recorrido, aquí se observa que los usuarios pueden tener distintos roles y departamentos. Los permisos determinan las funciones y la información disponibles para cada perfil; por eso, la experiencia del sistema puede variar según la cuenta.
>
> En síntesis, la interfaz web se comunica con la API de Django, que procesa las solicitudes y consulta la base de datos. El sistema combina esa arquitectura con funciones de autenticación, permisos e historial para apoyar la operación de la agencia.

**Preparar:** usar una captura sin datos personales. Si no es conveniente mostrar administración de usuarios, presentar únicamente el diagrama y explicar los permisos a nivel conceptual.

---

## 13:45–15:00 | Conclusiones y cierre

**[Diapositiva final: conclusiones y agradecimiento]**

> Como conclusión, el trabajo desarrolló una aplicación web orientada a centralizar información y apoyar la coordinación de procesos de BHealth Insurance. La solución integra un CRM para el personal y un portal separado para los clientes, con módulos para administrar y consultar expedientes, cotizaciones, pólizas y documentos.
>
> El principal aporte es disponer de una herramienta que organiza el trabajo y la información de la agencia dentro de un sistema común. Su alcance debe entenderse como apoyo a la gestión e intermediación: las decisiones de cobertura, la emisión oficial y las operaciones que corresponden a aseguradoras o plataformas externas permanecen fuera del sistema.
>
> Muchas gracias por su atención. Quedo atento a sus preguntas y observaciones.

## Lista de capturas sugeridas

1. Dashboard del CRM (`/crm/dashboard`).
2. Lista de pólizas y lista de cotizaciones (`/crm/polizas`, `/crm/cotizaciones`).
3. Detalle de una póliza, con datos ficticios.
4. Flujo entre áreas o historial de transferencias.
5. Documentos del expediente, o notas/historial si esa vista no está lista.
6. Portal del cliente (`/client/dashboard`).
7. Usuarios/roles y un diagrama simple: **Navegador (Next.js/React) → API REST (Django/DRF) → base de datos relacional**.

## Recomendaciones de ensayo

- Ensayar con cronómetro y procurar terminar el discurso en **14 minutos y 30 segundos**, dejando margen para pausas y cambios de captura.
- Tener las capturas en el orden de exposición y con nombres claros (`01-dashboard`, `02-polizas-cotizaciones`, etc.). No depender de una conexión en vivo.
- Mantener visible cada captura solo mientras se comenta la función correspondiente; evitar leer texto pequeño de la pantalla.
- Ocultar o reemplazar toda información personal, financiera o médica real.
- No atribuir al sistema cálculo automático de primas, emisión contractual, procesamiento de siniestros, rendimiento menor a dos segundos, resultados de encuestas ni cumplimiento normativo si no existe evidencia verificable.
- Antes de la defensa, hacer coincidir el título, objetivo, metodología y alcance de las diapositivas con la versión corregida de la tesis y con las funciones que realmente se pueden demostrar.
