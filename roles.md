                                    Roles y Permisos


ROL 1: ADMIN

CONTROL TOTAL DEL SISTEMA

●	Control de Accesos: Administración total de usuarios, asignación de departamentos y capacidad de finalizar sesiones activas de forma remota por seguridad.

●	Creador de Roles Dinámicos: Facultad de configurar nuevos perfiles de usuario mediante un Selector de Permisos Granulares (Matriz de Checkboxes).

●	Configuración de Integraciones: Gestión de llaves API y Webhooks para la comunicación con plataformas externas).

●	Auditoría (Audit Trail): Acceso al historial detallado que registra "Quién, qué, cómo y cuándo" se modificó un dato. Incluye el rastreo de inicios de sesión y logs de errores de entrada.

●	Exportación Maestra: Permiso para exportar la base de datos completa con todos los metadatos y campos técnicos en formatos .xlsx

●	Personalización del Dashboard: Facultad de modificar la interfaz global (añadir/quitar columnas) según las necesidades de la temporada de registros.

●	Centro de Mensajería Global: Editor de Anuncios Prioritarios (Banners) con capacidad de segmentación (elegir qué departamentos ven el aviso).

●	Gestión de Notificaciones Masivas: Envío de alertas técnicas a todo el personal (ej. "Mantenimiento del sistema en 10 minutos").



ROL 2: MANAGER (Líder de Departamento)
          SUPERVISIÓN OPERATIVA Y GESTIÓN DE FLUJO
●	Visibilidad Departamental: Capacidad de ver todas las pólizas del sistema, pero con filtros automáticos priorizados según su área (ej. el Manager de Pagos ve primero lo pendiente de cobro, o ve todas las pólizas que tengan una prima).

●	Edición de Campos Protegidos: Permiso exclusivo para corregir datos críticos (SSN, Ingresos, Fecha de Nacimiento) que están bloqueados para los Asistentes.

●	Asignación y Reequilibrio: Capacidad de mover pólizas entre usuarios de su equipo para evitar cuellos de botella.

●	Acciones Masivas: Cambiar el estatus de hasta 50 pólizas simultáneamente (ej. marcar como "CANCELADO a NEW" en bloque).

●	Archivar y Desarchivar Pólizas: Permiso para Archivar y Desarchivar pólizas de manera individual o masiva 

●	Pase de entrega (Transferencia): Botón para aprobar el trabajo de su departamento y enviarlo formalmente al siguiente nivel del flujo.

●	Audit Trail Departamental (Historial de Cambios): Permiso para consultar quién de su equipo o otro departamento realizó la última modificación en una póliza específica. Esto permite identificar errores de capacitación sin necesidad de llamar al Admin.

●	Poder de dar puntos de experiencias por un buen trabajo realizado a los usuarios bajo su responsabilidad.

●	Permiso para escribir un texto en un banner que solo su equipo pueda ver como por ejemplo: “Recuerden terminar los cambios de vida”

            ROL 3: ASISTENTE (Ventas e Inscripción)

            CAPTACIÓN DE CLIENTES Y GESTIÓN

●	Creación de Prospectos: Permiso para dar de alta a nuevos clientes en la plataforma y generar los enlaces de invitación para que el cliente cree su cuenta.

●	Acompañamiento en el Registro: Capacidad de visualizar en tiempo real el progreso de los formularios que el cliente está llenando para asistirlo telefónicamente si se detiene en algún paso.

●	Gestión de Cartera Propia: Acceso exclusivo a la lista de clientes que él mismo ha creado, asegurando la privacidad entre asistente de ventas.

●	Comunicación Directa: Permiso para enviar recordatorios automáticos (vía app o notificaciones) a clientes que tienen formularios incompletos.

●	Validación de Etapa en Vivo (Live Checkpoint): Capacidad de recibir y procesar solicitudes de verificación instantáneas enviadas por el cliente desde la app. El asistente actúa como el "filtro de seguridad" que desbloquea el siguiente módulo del formulario una vez confirmada la veracidad de los datos.

●	Supervisión de Sesión Activa: Permiso para visualizar el progreso del cliente en tiempo real, permitiendo identificar en qué campo exacto se encuentra el usuario durante la llamada, si es de ser necesario.

●	Campos Sensibles Bloqueados: No puede ver el SSN, CUENTAS BANCARIAS completo ni editar el Campo una vez que la póliza ha sido creada

●	Botón de "Sugerir Corrección": En lugar de editar el dato directamente, el asistente tiene un botón para enviarle una notificación al cliente: "Tu asistente sugiere corregir el campo Apellido", y es el cliente quien realiza el cambio en su propia cuenta.

●	Prohibición de Descarga (Download Block): El asistente tiene estrictamente restringida la descarga de cualquier archivo o documento subido por el cliente a la plataforma (IDs, comprobantes de ingresos, declaraciones de impuestos, etc.). Solo puede visualizarlo

●	Bloqueo de Impresión: La función de impresión del navegador estará restringida para las páginas que contengan documentación e información sensible del cliente.




ROL 4: SHERPA
PROCESAMIENTO TÉCNICO Y SOMETIMIENTO (ENLACE CON EL MERCADO)
●	Sincronización con el Mercado de Salud: Tiene el permiso para realizar el "Submit" (Sometimiento) de la póliza en las plataformas oficiales utilizando los datos del formulario del cliente.

●	Gestión de Estatus: Es el único autorizado para actualizar el estatus técnico de la póliza en el sistema (ej. Submitted, Pending Effectuation, Active, Canceled, etc).

●	Descarga y Transmisión de Documentación: A diferencia del Asistente, el Sherpa sí puede descargar los documentos (IDs, ingresos) para subirlos a las plataformas del gobierno para su verificación de la póliza

●	Asignación de FFM ID y NPN: Debe ingresar el número de folio oficial que genera el gobierno una vez que la póliza es aceptada.

●	Corrección de Datos Técnicos: Puede editar campos que el Mercado de Salud exija corregir (ej. códigos postales, dirección o corrección de nombres etc).

●	Reporte de Errores al Asistente: Si detecta que un expediente está mal, tiene un botón para "Rechazar y Devolver" la póliza al Asistente con una nota explicativa (ej. "Documento de identidad borroso").

●	Creación de Clientes Nuevos: No puede dar de alta prospectos. Su trabajo comienza únicamente cuando recibe un expediente del departamento de Asistentes.

●	Contacto Directo con el Cliente: No tiene acceso a las herramientas de llamada o chat con el cliente; si falta información, debe pedirla a través del Asistente o el Manager.

●	Gestión de Citas: No tiene acceso al módulo de citas médicas, ya que su labor termina cuando la póliza queda legalmente inscrita.

●	Borrado de Registros: Al igual que los demás roles operativos, no puede eliminar pólizas del sistema, solo cambiar su estatus a "Cancelado" o "Inactivo”.

●	Controla y hace seguimiento a las pólizas que tenga asignado por el NPN para cualquier cambio



ROL 5: PAGOS
          CONCILIACIÓN FINANCIERA Y SEGUIMIENTO DE EFECTUACIÓN
●	Gestión de Estatus de Pago: Permiso para marcar pólizas como "Paid" (Pagada), "Pending Payment" (Pago Pendientel) o "Missed Payment" (Pago Fallido).

●	Carga de Comprobantes de Pago: Puede subir capturas de pantalla o recibos de pago que el cliente envíe para demostrar que ya realizó su depósito.

●	Historial Financiero: Permiso para escribir notas en el registro del cliente relacionadas exclusivamente con su historial de pagos (ej. "Cliente solicitó cambio de fecha de cobro").

●	Generación de Alertas de Cancelación: Botón para marcar pólizas en riesgo de ser canceladas por el Mercado de Salud debido a falta de pago, enviando una alerta a la cuenta del cliente.

●	Editar Datos Personales: No tiene permiso para cambiar nombres, SSN o ingresos del cliente. Si detecta un error, debe reportarlo al Manager.

ROL 6: CITAS
GESTIÓN DE SERVICIOS MÈDICOS Y ATENCIÓN POST-VENTA

●	Gestión de Calendario: Capacidad de ver, crear y modificar citas médicas o administrativas solicitadas por el cliente a través de la app.

●	Confirmación de Citas: Permiso para marcar una cita como "Confirmada", "Realizada" o "Cancelada".

●	Envío de Recordatorios: Botón para enviar notificaciones automáticas (SMS, Email o Push) al cliente con los detalles de su próxima cita.

●	Visualización de Estatus de Póliza: Puede ver si la póliza está "Active (Effectuated)" para asegurar que el cliente tenga cobertura antes de confirmar la cita.

●	Notas de Seguimiento: Registro de comentarios sobre la cita (ej. "Cliente requiere traductor", "Cita movida por solicitud del médico").

●	Editar Datos: No tienen permiso de editar cualquier información de la cuenta del cliente.




“Recomendación, que no tiene nada que ver con los roles” 
- Cada usuario que pueda ver quien esta en linea en una póliza para asi saber quien esta trabajando en esa póliza
- evitar espacios extras en las casillas
-verificación de la cuenta del cliente mediante una verificación KYC:En resumen, el término técnico que buscas es verificación facial o verificación biométrica facial, y es la técnica que combina tu selfie o imagen con tu documento de identidad para confirmar tu identidad.




