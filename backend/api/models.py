import uuid
from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User
from django.db.models.signals import post_save, post_delete, m2m_changed, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
import re

class Agencia(models.Model):
    # Basic Info
    nombre = models.CharField(max_length=255, verbose_name="Nombre Agencia") # Internal/Display
    codigo_postal = models.CharField(max_length=20, verbose_name="Código Postal", null=True, blank=True)
    cliente_desde = models.DateField(null=True, blank=True, verbose_name="Cliente Desde")
    ultima_actualizacion = models.DateTimeField(auto_now=True, verbose_name="Última Actualización")
    
    # Business Info
    nombre_legal = models.CharField(max_length=255, verbose_name="Nombre Legal", null=True, blank=True)
    dba = models.CharField(max_length=255, verbose_name="DBA (Nombre Comercial)", null=True, blank=True)
    telefono = models.CharField(max_length=50, verbose_name="Teléfono", null=True, blank=True)
    email = models.EmailField(verbose_name="Correo Electrónico", null=True, blank=True)
    
    # Business Address (Linked)
    direccion_negocio = models.ForeignKey(
        'Direccion', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='agencia_negocio',
        verbose_name="Dirección del Negocio"
    )

    # Branding
    logo_light = models.ImageField(upload_to='agencia/logos/', null=True, blank=True, verbose_name="Logo Claro")
    logo_dark = models.ImageField(upload_to='agencia/logos/', null=True, blank=True, verbose_name="Logo Oscuro")
    favicon = models.ImageField(upload_to='agencia/favicons/', null=True, blank=True, verbose_name="Favicon")
    titulo_portal = models.CharField(max_length=255, verbose_name="Título del Portal", null=True, blank=True)
    pie_email = models.TextField(verbose_name="Pie de Correos", null=True, blank=True)

    def __str__(self):
        return self.nombre

class Direccion(models.Model):
    linea1 = models.CharField(max_length=255, verbose_name="Dirección 1")
    linea2 = models.CharField(max_length=255, blank=True, null=True, verbose_name="Dirección 2")
    ciudad = models.CharField(max_length=100, verbose_name="Ciudad")
    estado = models.CharField(max_length=100, verbose_name="Estado")
    zip_code = models.CharField(max_length=20, verbose_name="ZIP")
    condado = models.CharField(max_length=100, verbose_name="Condado")

    def __str__(self):
        return f"{self.linea1}, {self.ciudad}"

class Agente(models.Model):
    npn = models.CharField(max_length=50, unique=True, verbose_name="NPN")
    ffm = models.CharField(max_length=100, blank=True, null=True, verbose_name="FFM Mercado")
    nombre_completo = models.CharField(max_length=255, verbose_name="Nombre Completo")
    agencia = models.ForeignKey(Agencia, on_delete=models.CASCADE, related_name='agentes')

    def __str__(self):
        return self.nombre_completo

class Cliente(models.Model):
    primer_nombre = models.CharField(max_length=100, verbose_name="Primer Nombre")
    segundo_nombre = models.CharField(max_length=100, blank=True, null=True, verbose_name="Segundo Nombre")
    apellido_paterno = models.CharField(max_length=100, verbose_name="Apellido Paterno")
    apellido_materno = models.CharField(max_length=100, blank=True, null=True, verbose_name="Apellido Materno")
    genero = models.CharField(max_length=20, verbose_name="Género")
    fecha_nacimiento = models.DateField(verbose_name="Fecha de Nacimiento")
    ssn = models.CharField(max_length=20, unique=True, verbose_name="SSN")
    email = models.EmailField(verbose_name="Email", blank=True, null=True)
    telefono = models.CharField(max_length=20, verbose_name="Teléfono", blank=True, null=True)
    ingreso_anual = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Ingreso Anual")
    estado_civil = models.CharField(max_length=50, verbose_name="Estado Civil")
    pais_nacimiento = models.CharField(max_length=100, verbose_name="País de Nacimiento")
    estado_inmigracion = models.CharField(max_length=100, verbose_name="Estado de Inmigración")
    categoria_inmigracion = models.CharField(max_length=100, blank=True, null=True, verbose_name="Categoría de Inmigración")
    numero_uscis = models.CharField(max_length=50, blank=True, null=True, verbose_name="Número USCIS")
    numero_naturalizacion = models.CharField(max_length=50, blank=True, null=True, verbose_name="Número de naturalización")
    idioma_preferido = models.CharField(max_length=20, blank=True, null=True, default='ES', verbose_name="Idioma preferido")
    
    # Nuevos campos de salud y estilo de vida
    usa_tabaco = models.BooleanField(default=False, verbose_name="Usa Tabaco")
    peso = models.CharField(max_length=50, blank=True, null=True, verbose_name="Peso")
    estatura = models.CharField(max_length=50, blank=True, null=True, verbose_name="Estatura")
    condicion_medica = models.TextField(blank=True, null=True, verbose_name="Condición Médica")
    
    fecha_creacion = models.DateTimeField(default=timezone.now, verbose_name="Fecha de Creación")

    # Addresses (owned by client)
    direccion_fisica = models.ForeignKey(
        'Direccion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clientes_direccion_fisica',
        verbose_name="Dirección Física"
    )
    direccion_postal = models.ForeignKey(
        'Direccion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clientes_direccion_postal',
        verbose_name="Dirección Postal"
    )
    direccion_facturacion = models.ForeignKey(
        'Direccion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clientes_direccion_facturacion',
        verbose_name="Dirección Facturación"
    )

    # Marketplace Login
    marketplace_user = models.CharField(max_length=150, blank=True, null=True, verbose_name="Usuario Mercado")
    marketplace_url = models.URLField(max_length=500, blank=True, null=True, verbose_name="Link Mercado")
    # Store encrypted
    marketplace_password = models.CharField(max_length=255, blank=True, null=True, verbose_name="Contraseña Mercado") 

    # Carrier Portal Login
    portal_user = models.CharField(max_length=150, blank=True, null=True, verbose_name="Usuario Portal Aseguradora")
    portal_url = models.URLField(max_length=500, blank=True, null=True, verbose_name="Link Portal Aseguradora")
    # Store encrypted
    portal_password = models.CharField(max_length=255, blank=True, null=True, verbose_name="Contraseña Portal Aseguradora")

    def __str__(self):
        return f"{self.primer_nombre} {self.apellido_paterno}"

class IngresoEmpleador(models.Model):
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name='ingresos_empleador',
        verbose_name="Cliente",
    )
    nombre_empleador = models.CharField(max_length=255, blank=True, default='', verbose_name="Nombre del empleador")
    telefono_empleador = models.CharField(max_length=30, blank=True, default='', verbose_name="Teléfono del empleador")
    cargo_ocupacion = models.CharField(max_length=255, blank=True, default='', verbose_name="Cargo / Ocupación")
    ingreso_anual = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Ingreso anual")
    ingreso_mensual = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Ingreso mensual")
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = "Ingreso por empleador"
        verbose_name_plural = "Ingresos por empleador"

    def __str__(self):
        return f"{self.nombre_empleador or 'Empleador'} — {self.cliente}"

class DocumentoLegalCliente(models.Model):
    TIPO_CHOICES = [
        ('ssn', 'Seguro Social (SSN)'),
        ('green_card', 'Green card'),
        ('permiso_trabajo', 'Permiso de trabajo'),
        ('pasaporte', 'Pasaporte'),
        ('licencia', 'Licencia de conducir'),
    ]

    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name='documentos_legales',
        verbose_name='Cliente',
    )
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES, verbose_name='Tipo de documento')
    documento = models.ForeignKey(
        'Documento',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vinculos_legales',
        verbose_name='Documento de la póliza',
    )
    numero_documento = models.CharField(max_length=100, blank=True, default='', verbose_name='Número de documento')
    fecha_emision = models.DateField(null=True, blank=True, verbose_name='Fecha de emisión')
    fecha_vencimiento = models.DateField(null=True, blank=True, verbose_name='Fecha de vencimiento')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['tipo']
        verbose_name = 'Documento legal del cliente'
        verbose_name_plural = 'Documentos legales del cliente'
        constraints = [
            models.UniqueConstraint(fields=['cliente', 'tipo'], name='unique_cliente_tipo_documento_legal'),
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} — {self.cliente}"

class Aseguradora(models.Model):
    nombre = models.CharField(max_length=255, verbose_name="Nombre Aseguradora")

    def __str__(self):
        return self.nombre

class TipoProducto(models.Model):
    nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre del Producto")
    descripcion = models.TextField(verbose_name="Descripción")

    def __str__(self):
        return self.nombre

class Plan(models.Model):
    id_plan_aseguradora = models.CharField(max_length=100, verbose_name="ID Plan Aseguradora")
    nombre = models.CharField(max_length=255, verbose_name="Nombre Plan")
    aseguradora = models.ForeignKey(Aseguradora, on_delete=models.CASCADE, related_name='planes')
    tipo_producto = models.ForeignKey(TipoProducto, on_delete=models.PROTECT, related_name='planes')

    def __str__(self):
        return self.nombre

class ImportBatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='import_batches')
    fecha_importacion = models.DateTimeField(auto_now_add=True)
    nombre_archivo = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.nombre_archivo} - {self.fecha_importacion.strftime('%Y-%m-%d %H:%M')}"

class EstadoPoliza(models.Model):
    nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre Estado")
    color = models.CharField(max_length=7, default="#ef4444", verbose_name="Color Hexadecimal")
    disponible_para_agentes = models.BooleanField(default=True, verbose_name="¿Disponible para agentes?")

    def __str__(self):
        return f"{self.nombre}"


class Poliza(models.Model):
    TIPO_INSCRIPCION_CHOICES = [
        ('NUEVA', 'Nueva Venta'),
        ('RENOVACION', 'Renovación'),
    ]
    FLUJO_ETAPA_CHOICES = [
        ('CAPTURA_ASISTENTE', 'Captura Asistente'),
        ('REVISION_MANAGER', 'Revisión Manager'),
        ('EN_PROCESO_SHERPA', 'En Proceso Sherpa'),
        ('DEVUELTA_ASISTENTE', 'Devuelta a Asistente'),
        ('COMPLETADA_SHERPA', 'Completada por Sherpa'),
    ]
    ESTADO_CONSENTIMIENTO_CHOICES = [
        ('NO_ENVIADO', 'No Enviado'),
        ('ENVIADO', 'Enviado / Pendiente de Firma'),
        ('FIRMADO', 'Recibido / Firmado'),
    ]
    ESTADO_DOCUMENTO_POLIZA_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_REVISION', 'En revisión'),
        ('RECIBIDO', 'Recibido'),
        ('APROBADO', 'Aprobado'),
        ('RECHAZADO', 'Rechazado'),
    ]
    METAL_CHOICES = [
        ('BRONCE', 'Bronce'),
        ('PLATA', 'Plata'),
        ('ORO', 'Oro'),
        ('PLATINO', 'Platino'),
    ]

    id_mercado = models.CharField(max_length=100, verbose_name="ID Mercado")
    id_miembro = models.CharField(max_length=100, verbose_name="ID Miembro")
    costo_poliza = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Costo Póliza")
    subsidio = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Subsidio")
    prima_mensual = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Prima Mensual")
    total_ahorros = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Total Ahorros")
    plan_era = models.CharField(max_length=255, blank=True, null=True, verbose_name="El Plan Era (Calculado)")
    
    fecha_efectiva = models.DateField(null=True, blank=True, verbose_name="Fecha Efectiva")
    estado = models.ForeignKey(EstadoPoliza, on_delete=models.SET_NULL, null=True, verbose_name="Estado")
    fecha_envio = models.DateField(verbose_name="Fecha Envío")
    fecha_cancelacion = models.DateField(null=True, blank=True, verbose_name="Fecha Cancelación")
    id_interno = models.CharField(max_length=100, null=True, blank=True, verbose_name="ID Interno")
    flujo_etapa = models.CharField(
        max_length=30,
        choices=FLUJO_ETAPA_CHOICES,
        default='CAPTURA_ASISTENTE',
        verbose_name='Etapa de Flujo'
    )
    ultima_actualizacion = models.DateTimeField(auto_now=True, verbose_name="Última Actualización")
    es_duplicado = models.BooleanField(default=False, verbose_name="Es Duplicado")
    ultimo_duplicado = models.CharField(max_length=100, blank=True, null=True, verbose_name="Último Duplicado")
    tipo_producto = models.ForeignKey(TipoProducto, on_delete=models.PROTECT, related_name='polizas')
    aseguradora = models.ForeignKey(
        'Aseguradora', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='polizas', verbose_name="Aseguradora"
    )
    nombre_plan = models.CharField(max_length=255, blank=True, null=True, verbose_name="Nombre del Plan")
    metal = models.CharField(
        max_length=20, choices=METAL_CHOICES, blank=True, null=True, verbose_name="Metal del Plan"
    )
    id_plan_cms = models.CharField(max_length=100, blank=True, null=True, verbose_name="ID Plan CMS")
    
    ffm_mercado = models.CharField(max_length=100, blank=True, null=True, verbose_name="FFM Usado en Mercado")
    npn_mercado = models.CharField(max_length=50, blank=True, null=True, verbose_name="NPN Mercado")
    tipo_inscripcion = models.CharField(max_length=20, choices=TIPO_INSCRIPCION_CHOICES, blank=True, null=True, verbose_name="Tipo Inscripción")
    razon_inscripcion_especial = models.CharField(max_length=255, blank=True, null=True, verbose_name="Razón Inscripción Especial")
    fecha_inscripcion_especial = models.DateField(null=True, blank=True, verbose_name="Fecha Inscripción Especial")
    
    # Archivos Legales
    archivo_consentimiento = models.FileField(upload_to='consentimientos/', blank=True, null=True, verbose_name="Archivo de Consentimiento")
    estado_consentimiento = models.CharField(
        max_length=50,
        choices=ESTADO_CONSENTIMIENTO_CHOICES,
        default='NO_ENVIADO',
        verbose_name="Estado de Consentimiento"
    )
    estado_documento = models.CharField(
        max_length=50,
        choices=ESTADO_DOCUMENTO_POLIZA_CHOICES,
        default='PENDIENTE',
        verbose_name="Estado de Documentación",
    )
    
    # Information Totals
    total_miembros = models.IntegerField(default=0, verbose_name="Total Miembros")
    total_aplicantes = models.IntegerField(default=0, verbose_name="Total Aplicantes")
    total_dependientes = models.IntegerField(default=0, verbose_name="Total Dependientes")
    
    # Addresses (Linked to Policy)
    direccion_fisica = models.ForeignKey(Direccion, on_delete=models.SET_NULL, null=True, blank=True, related_name='poliza_fisica', verbose_name="Dirección Física")
    direccion_postal = models.ForeignKey(Direccion, on_delete=models.SET_NULL, null=True, blank=True, related_name='poliza_postal', verbose_name="Dirección Postal")
    direccion_facturacion = models.ForeignKey(Direccion, on_delete=models.SET_NULL, null=True, blank=True, related_name='poliza_facturacion', verbose_name="Dirección Facturación")

    agente = models.ForeignKey(Agente, on_delete=models.SET_NULL, null=True, related_name='polizas')
    agente_registro = models.ForeignKey(
        Agente,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='polizas_registradas',
        verbose_name='Agente que registró',
    )
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True, related_name='polizas')
    clientes = models.ManyToManyField(Cliente, through='PolizaCliente', related_name='polizas')
    colaboradores = models.ManyToManyField(User, related_name='polizas_colaboracion', blank=True, verbose_name="Colaboradores")
    import_batch = models.ForeignKey(ImportBatch, on_delete=models.SET_NULL, null=True, blank=True, related_name='polizas')
    etiquetas = models.ManyToManyField('Etiqueta', related_name='polizas_etiquetadas', blank=True, verbose_name="Etiquetas")

    notas_comentarios = models.TextField(blank=True, null=True, verbose_name="Notas o Comentarios")
    info_medico_principal = models.TextField(blank=True, null=True, verbose_name="Información del Médico Principal")
    medico_especializacion = models.CharField(max_length=255, blank=True, null=True, verbose_name="Especialización del Médico")
    medico_hospital = models.CharField(max_length=255, blank=True, null=True, verbose_name="Hospital del Médico")
    medicamentos_necesarios = models.TextField(blank=True, null=True, verbose_name="Medicamentos Necesarios")
    medicamentos_dosis = models.CharField(max_length=255, blank=True, null=True, verbose_name="Dosis de Medicamentos")

    def __str__(self):
        return self.id_mercado

class MedicoPoliza(models.Model):
    poliza = models.ForeignKey(
        Poliza,
        on_delete=models.CASCADE,
        related_name='medicos_principales',
        verbose_name="Póliza",
    )
    nombre = models.TextField(verbose_name="Nombre / Información del médico")
    especializacion = models.CharField(max_length=255, blank=True, null=True, verbose_name="Especialización")
    hospital = models.CharField(max_length=255, blank=True, null=True, verbose_name="Hospital")
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")

    class Meta:
        verbose_name = "Médico de póliza"
        verbose_name_plural = "Médicos de póliza"
        ordering = ['fecha_creacion', 'id']

    def __str__(self):
        return self.nombre[:80] if self.nombre else f"Médico #{self.pk}"

class PolizaCliente(models.Model):
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    es_solicitante_principal = models.BooleanField(default=False, verbose_name="Es Solicitante Principal")
    es_aplicante = models.BooleanField(default=False, verbose_name="Es aplicante")
    relacion = models.CharField(max_length=50, verbose_name="Relación")
    direccion_residencia = models.ForeignKey(Direccion, on_delete=models.SET_NULL, null=True, related_name='polizas_residencia')
    direccion_postal = models.ForeignKey(Direccion, on_delete=models.SET_NULL, null=True, related_name='polizas_postal')

    class Meta:
        verbose_name = "Póliza Cliente"
        verbose_name_plural = "Pólizas Clientes"

class Licencia(models.Model):
    agente = models.ForeignKey(Agente, on_delete=models.CASCADE, related_name='licencias')
    anio = models.IntegerField(verbose_name="Año")
    estado = models.CharField(max_length=100, verbose_name="Estado (USA)")
    aseguradoras = models.ManyToManyField(Aseguradora, related_name='licencias')

    class Meta:
        unique_together = ('agente', 'anio', 'estado')
        verbose_name = "Licencia"
        verbose_name_plural = "Licencias"

    def __str__(self):
        return f"{self.agente} - {self.estado} ({self.anio})"

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'),
        ('ASISTENTE', 'Asistente'),
        ('SHERPA', 'Sherpa'),
        ('PAGOS', 'Pagos'),
        ('CITAS', 'Citas'),
        ('CLIENTE', 'Cliente'),
        ('USER', 'Usuario Básico'),
    ]
    STATUS_CHOICES = [
        ('ACTIVE', 'Activo'),
        ('INACTIVE', 'Inactivo'),
        ('CANDIDATE', 'Candidato'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='USER')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE', verbose_name="Estatus")
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name="Avatar")
    telefono = models.CharField(max_length=20, null=True, blank=True, verbose_name="Teléfono")
    npn = models.CharField(max_length=50, null=True, blank=True, verbose_name="NPN")
    ssn = models.CharField(max_length=20, null=True, blank=True, verbose_name="SSN")
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios_portal',
        verbose_name="Cliente vinculado",
    )
    agente = models.OneToOneField(Agente, on_delete=models.SET_NULL, null=True, blank=True, related_name='user_profile')
    settings = models.JSONField(default=dict, blank=True, null=True, verbose_name="Configuraciones de UI")

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    try:
        instance.profile.save()
    except UserProfile.DoesNotExist:
        UserProfile.objects.get_or_create(user=instance)

class Nota(models.Model):
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='notas')
    autor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notas_creadas')
    contenido = models.TextField(verbose_name="Contenido")
    archivo = models.FileField(upload_to='notas_archivos/', null=True, blank=True, verbose_name="Archivo Adjunto")
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    usuarios_etiquetados = models.ManyToManyField(User, related_name='notas_mencionado', blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Extract mentions
        mentions = re.findall(r'@(\w+)', self.contenido)
        for username in mentions:
            try:
                user = User.objects.get(username=username)
                self.usuarios_etiquetados.add(user)
                # Also add to policy collaborators
                self.poliza.colaboradores.add(user)
            except User.DoesNotExist:
                pass

    def __str__(self):
        return f"Nota en {self.poliza} por {self.autor.username}"

class NotaAdjunto(models.Model):
    nota = models.ForeignKey(Nota, on_delete=models.CASCADE, related_name='adjuntos')
    archivo = models.FileField(upload_to='notas_archivos/', verbose_name="Archivo Adjunto")
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")

    def __str__(self):
        return f"Adjunto nota #{self.nota_id}"

class HistorialPoliza(models.Model):
    ACCION_CHOICES = [
        ('CREACION', 'Creación'),
        ('EDICION', 'Edición'),
        ('ELIMINACION', 'Eliminación'),
        ('NOTA_AGREGADA', 'Nota/Archivo Agregado'),
        ('NOTA_ELIMINADA', 'Nota/Archivo Eliminado'),
        ('DOCUMENTO_SUBIDO', 'Documento Subido'),
        ('DOCUMENTO_ELIMINADO', 'Documento Eliminado'),
        ('TRANSFERENCIA', 'Transferencia de Flujo'),
    ]
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='historial')
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    accion = models.CharField(max_length=20, choices=ACCION_CHOICES)
    detalles = models.TextField(blank=True, null=True)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_accion_display()} en {self.poliza} por {self.usuario}"

class Etiqueta(models.Model):
    TIPO_CHOICES = [
        ("DOCUMENTO", "Documento"),
        ("POLIZA", "Póliza"),
    ]
    nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre Etiqueta")
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default="DOCUMENTO", verbose_name="Tipo de Etiqueta")
    descripcion = models.TextField(null=True, blank=True, verbose_name="Descripción")
    color = models.CharField(max_length=20, null=True, blank=True, default="#6b7280", verbose_name="Color")

    def __str__(self):
        return f"{self.nombre} ({self.tipo})"


class Documento(models.Model):
    CATEGORIA_CHOICES = [
        ('CARTA_MERCADO', 'Carta de Mercado'),
        ('ASEGURANZA', 'Aseguranza'),
        ('CITAS_MEDICAS', 'Citas Médicas'),
        ('BILLS', 'Bills'),
        ('IDENTIFICACION', 'Identificación'),
        ('ESTATUS_MIGRATORIO', 'Estatus Migratorio'),
        ('CONSENTIMIENTO', 'Consentimiento'),
        ('OTRO', 'Otro'),
    ]
    ESTADO_DOCUMENTO_CHOICES = [
        ('SUBIDO', 'Subido'),
        ('PENDIENTE_REVISION', 'Pendiente de revisión'),
        ('APROBADO', 'Aprobado'),
        ('RECHAZADO', 'Rechazado'),
    ]
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='documentos')
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True, related_name='documentos', verbose_name="Cliente")
    archivo = models.FileField(upload_to='documentos_poliza/', verbose_name="Archivo")
    titulo = models.CharField(max_length=255, verbose_name="Título del Documento")
    fecha_subida = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Subida")
    fecha_vencimiento = models.DateField(null=True, blank=True, verbose_name="Fecha de Vencimiento")
    categoria = models.CharField(max_length=50, choices=CATEGORIA_CHOICES, default='OTRO', verbose_name="Categoría")
    estado_documento = models.CharField(
        max_length=50,
        choices=ESTADO_DOCUMENTO_CHOICES,
        default='SUBIDO',
        verbose_name="Estado del Documento",
    )
    subido_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name="Subido Por")
    etiquetas = models.ManyToManyField(Etiqueta, related_name='documentos', blank=True)

    def __str__(self):
        return f"{self.titulo} ({self.poliza})"

class Tarea(models.Model):
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='tareas')
    asignado_a = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tareas_asignadas', verbose_name="Asignado a")
    creado_por = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tareas_creadas', verbose_name="Creado por")
    titulo = models.CharField(max_length=255, verbose_name="Título")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    fecha_limite = models.DateTimeField(null=True, blank=True, verbose_name="Fecha Límite")
    completada = models.BooleanField(default=False, verbose_name="Completada")
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")

    def __str__(self):
        return f"{self.titulo} - {self.asignado_a.username}"


class CambioDeVida(models.Model):
    TIPO_CHOICES = [
        ('NUEVA_DIRECCION', 'Nueva dirección'),
        ('CAMBIO_INGRESOS', 'Cambio en los ingresos'),
        ('CAMBIO_ESTADO_MIGRATORIO', 'Cambio en el estado migratorio'),
        ('NUEVO_MIEMBRO', 'Nuevo miembro de la familia'),
        ('EMBARAZO', 'Embarazo'),
        ('FALLECIDO', 'Fallecido'),
        ('OTROS', 'Otros cambios'),
    ]
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_PROCESO', 'En proceso'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
    ]

    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='cambios_de_vida')
    agente = models.ForeignKey(
        Agente, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='cambios_de_vida', verbose_name="Agente asignado (póliza)"
    )
    agente_creador = models.ForeignKey(
        Agente, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='cambios_de_vida_creados', verbose_name="Agente que registró"
    )
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES, verbose_name="Tipo de cambio")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    datos = models.JSONField(default=dict, blank=True, verbose_name="Datos del cambio")
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE', verbose_name="Estado")
    asignado_a = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='cambios_de_vida_asignados', verbose_name="Asignado a"
    )
    creado_por = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='cambios_de_vida_creados', verbose_name="Creado por"
    )
    fecha_limite = models.DateTimeField(null=True, blank=True, verbose_name="Fecha límite")
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    fecha_actualizacion = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        verbose_name = "Cambio de vida"
        verbose_name_plural = "Cambios de vida"
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.poliza}"


class InfoPago(models.Model):
    ESTADO_PENDIENTE = 'PENDIENTE'
    ESTADO_AL_DIA = 'AL_DIA'
    ESTADO_VENCIDO = 'VENCIDO'
    ESTADO_CHOICES = [
        (ESTADO_PENDIENTE, 'Pendiente'),
        (ESTADO_AL_DIA, 'Al día'),
        (ESTADO_VENCIDO, 'Vencido'),
    ]

    poliza = models.OneToOneField(Poliza, on_delete=models.CASCADE, related_name='info_pago', verbose_name="Póliza")
    pago_recurrente = models.BooleanField(default=False, verbose_name="Pago Recurrente")
    fecha_primer_pago = models.DateField(null=True, blank=True, verbose_name="Fecha Primer Pago")
    dia_pago_preferido = models.IntegerField(null=True, blank=True, verbose_name="Día de Pago Preferido (1-31)")
    estado_pago = models.CharField(
        max_length=50,
        choices=ESTADO_CHOICES,
        default=ESTADO_PENDIENTE,
        verbose_name="Estado de Pago",
    )

    def __str__(self):
        return f"Pago Info {self.poliza}"

class TarjetaCredito(models.Model):
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='tarjetas_credito', verbose_name="Póliza")
    tipo_tarjeta = models.CharField(max_length=50, verbose_name="Tipo de Tarjeta")
    numero = models.CharField(max_length=500, verbose_name="Número de Tarjeta (Enmascarado)")
    nombre_titular = models.CharField(max_length=255, verbose_name="Nombre Titular")
    cvv = models.CharField(max_length=100, verbose_name="CVV")
    fecha_vencimiento = models.CharField(max_length=10, verbose_name="Fecha Vencimiento (MM/YY)")

    def __str__(self):
        return f"{self.tipo_tarjeta}"

class CuentaBancaria(models.Model):
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='cuentas_bancarias', verbose_name="Póliza")
    nombre_banco = models.CharField(max_length=255, verbose_name="Nombre del Banco")
    numero_cuenta = models.CharField(max_length=100, verbose_name="Número de Cuenta")
    aba_routing = models.CharField(max_length=100, verbose_name="ABA/Enrutamiento")
    titular_cuenta = models.CharField(max_length=255, verbose_name="Titular de la Cuenta")

    def __str__(self):
        return f"{self.nombre_banco} - {self.titular_cuenta}"

class PolizaViewer(models.Model):
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='viewers')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    last_seen = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('poliza', 'usuario')

    def __str__(self):
        return f"{self.usuario.username} viendo {self.poliza}"

class Medico(models.Model):
    nombre = models.CharField(max_length=255, verbose_name="Nombre Completo")
    hospital = models.CharField(max_length=255, verbose_name="Hospital")
    especializacion = models.CharField(max_length=255, verbose_name="Especialización")

    def __str__(self):
        return f"{self.nombre} - {self.hospital}"

class Cita(models.Model):
    ESTADO_CHOICES = [
        ('PROGRAMADA', 'Programada'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
        ('NO_ASISTIO', 'No Asistió'),
    ]
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='citas', verbose_name="Póliza")
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True, related_name='citas', verbose_name="Paciente")
    creado_por = models.ForeignKey(User, on_delete=models.CASCADE, related_name='citas_creadas', verbose_name="Creado por")
    fecha_hora = models.DateTimeField(verbose_name="Fecha y Hora")
    proveedor = models.CharField(max_length=255, verbose_name="Proveedor/Doctor")
    lugar = models.CharField(max_length=255, verbose_name="Lugar/Dirección")
    motivo = models.TextField(blank=True, null=True, verbose_name="Motivo de la Cita")
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PROGRAMADA', verbose_name="Estado")
    notas = models.TextField(blank=True, null=True, verbose_name="Notas Adicionales")
    medico_asignado = models.ForeignKey(Medico, on_delete=models.SET_NULL, null=True, blank=True, related_name='citas_medicas', verbose_name="Médico Asignado")
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")

    class Meta:
        verbose_name = "Cita Médica"
        verbose_name_plural = "Citas Médicas"
        ordering = ['fecha_hora']

    def __str__(self):
        return f"Cita {self.cliente} - {self.fecha_hora.date()}"

class Medicamento(models.Model):
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='medicamentos', verbose_name="Póliza")
    nombre = models.CharField(max_length=255, verbose_name="Nombre del Medicamento")
    dosis = models.CharField(max_length=100, blank=True, null=True, verbose_name="Dosis")
    frecuencia = models.CharField(max_length=100, blank=True, null=True, verbose_name="Frecuencia")
    fecha_inicio = models.DateField(null=True, blank=True, verbose_name="Fecha de Inicio")
    fecha_fin = models.DateField(null=True, blank=True, verbose_name="Fecha de Fin")
    activo = models.BooleanField(default=True, verbose_name="Activo")

    def __str__(self):
        return f"{self.nombre} ({self.dosis})"

class Recordatorio(models.Model):
    TIPO_CHOICES = [
        ('ESTADO_MIGRATORIO', 'Estado migratorio'),
        ('VERIFICACION_INGRESOS', 'Verificación de ingresos'),
        ('REALIZAR_PAGO', 'Realizar pago'),
        ('CARGAR_DOCUMENTOS', 'Cargar documentos'),
        ('ACTUALIZAR_INFO_CLIENTE', 'Actualizar información del cliente'),
        ('OTRO', 'Otro'),
    ]

    ANTELACION_CHOICES = [
        ('30m', '30 minutos antes'),
        ('1h', '1 hora antes'),
        ('2h', '2 horas antes'),
        ('1d', '1 día antes'),
        ('3d', '3 días antes'),
        ('7d', '7 días antes'),
    ]

    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='recordatorios', verbose_name="Póliza")
    titulo = models.CharField(max_length=255, verbose_name="Para qué es este recordatorio")
    tipo = models.CharField(max_length=40, choices=TIPO_CHOICES, default='OTRO', verbose_name="Tipo de recordatorio")
    motivo = models.CharField(max_length=255, blank=True, default='', verbose_name="Motivo")
    fecha_vencimiento = models.DateField(verbose_name="Fecha de Vencimiento")
    hora_vencimiento = models.TimeField(verbose_name="Hora de Vencimiento")
    zona_horaria = models.CharField(max_length=50, default="UTC", verbose_name="Zona Horaria")
    antelacion = models.CharField(
        max_length=4,
        choices=ANTELACION_CHOICES,
        default='1h',
        verbose_name="Notificar con antelación",
    )
    establecer_recordatorio = models.BooleanField(default=True, verbose_name="Enviar notificación automática")
    es_privado = models.BooleanField(default=False, verbose_name="Recordatorio privado")
    creado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recordatorios_creados',
        verbose_name="Creado por",
    )
    usuario_notificar = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recordatorios_asignados', verbose_name="Quién debe ser notificado")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción o Comentarios")
    notificado = models.BooleanField(default=False, verbose_name="Notificación enviada")
    fecha_notificacion = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de notificación")
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['fecha_vencimiento', 'hora_vencimiento']

    def __str__(self):
        return f"Recordatorio: {self.titulo} - {self.fecha_vencimiento}"

    def get_tipo_display_label(self):
        return dict(self.TIPO_CHOICES).get(self.tipo, self.tipo)

    def get_antelacion_display_label(self):
        return dict(self.ANTELACION_CHOICES).get(self.antelacion, self.antelacion)

class PolizaTransferencia(models.Model):
    ACCION_CHOICES = [
        ('ENTREGA_ASISTENTE_MANAGER', 'Entrega Asistente a Manager'),
        ('APROBACION_MANAGER_SHERPA', 'Aprobación Manager a Sherpa'),
        ('DEVOLUCION_SHERPA_ASISTENTE', 'Devolución Sherpa a Asistente'),
        ('CIERRE_SHERPA', 'Cierre por Sherpa'),
    ]
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='transferencias')
    de_usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='transferencias_emitidas')
    a_usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='transferencias_recibidas')
    de_rol = models.CharField(max_length=20)
    a_rol = models.CharField(max_length=20)
    accion = models.CharField(max_length=40, choices=ACCION_CHOICES)
    nota = models.TextField(blank=True, null=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.poliza.id_mercado}: {self.de_rol} -> {self.a_rol}"

class MatrizPermisoRol(models.Model):
    ROLE_CHOICES = UserProfile.ROLE_CHOICES
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    modulo = models.CharField(max_length=100)
    accion = models.CharField(max_length=100)
    permitido = models.BooleanField(default=True)
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    actualizado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('role', 'modulo', 'accion')
        ordering = ['role', 'modulo', 'accion']

    def __str__(self):
        return f"{self.role} - {self.modulo}.{self.accion}: {self.permitido}"

class AuditoriaGlobal(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    accion = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    objeto_id = models.CharField(max_length=100, blank=True, null=True)
    detalles = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        user_name = self.usuario.username if self.usuario else 'Sistema'
        return f"{self.accion} - {self.modelo} por {user_name}"

class IntentoLoginFallido(models.Model):
    usuario_intentado = models.CharField(max_length=255, verbose_name="Usuario / Email Intentado")
    password_intentado = models.CharField(max_length=255, blank=True, null=True, verbose_name="Contraseña Intentada")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    fecha_intento = models.DateTimeField(auto_now_add=True)
    user_agent = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Fallo: {self.usuario_intentado} en {self.fecha_intento}"

class Contrato(models.Model):
    titulo = models.CharField(max_length=255, verbose_name="Título")
    archivo = models.FileField(upload_to='contratos/', verbose_name="Archivo del Contrato")
    fecha_inicio = models.DateField(verbose_name="Fecha Inicio")
    fecha_fin = models.DateField(verbose_name="Fecha Fin", null=True, blank=True)
    agente = models.ForeignKey(Agente, on_delete=models.CASCADE, related_name='contratos', verbose_name="Agente")
    activo = models.BooleanField(default=True, verbose_name="Activo")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    
    zoho_request_id = models.CharField(max_length=255, blank=True, null=True, verbose_name="Zoho Request ID")
    zoho_status = models.CharField(max_length=50, blank=True, null=True, verbose_name="Zoho Status")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.titulo} - {self.agente}"

class ReporteComision(models.Model):
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('PAGADO', 'Pagado'),
        ('CANCELADO', 'Cancelado'),
    ]
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='reportes_comision', verbose_name="Póliza")
    agente = models.ForeignKey(Agente, on_delete=models.CASCADE, related_name='reportes_comision', verbose_name="Agente")
    monto = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Monto")
    fecha_pago = models.DateField(verbose_name="Fecha de Pago")
    estado = models.CharField(max_length=50, choices=ESTADO_CHOICES, default='PENDIENTE', verbose_name="Estado")
    comentarios = models.TextField(blank=True, null=True, verbose_name="Comentarios")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comision {self.poliza} - {self.monto}"


class ConfiguracionComision(models.Model):
    NIVEL_CHOICES = [
        ('AGENCIA', 'Agencia'),
        ('PROVEEDOR', 'Proveedor'),
        ('PLAN', 'Plan'),
    ]

    nivel = models.CharField(max_length=20, choices=NIVEL_CHOICES, verbose_name='Nivel')
    agencia = models.ForeignKey(Agencia, on_delete=models.CASCADE, null=True, blank=True, related_name='configuraciones_comision')
    aseguradora = models.ForeignKey(Aseguradora, on_delete=models.CASCADE, null=True, blank=True, related_name='configuraciones_comision')
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, null=True, blank=True, related_name='configuraciones_comision')
    porcentaje = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Porcentaje de Comisión')
    activo = models.BooleanField(default=True)
    descripcion = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        target = self.agencia or self.aseguradora or self.plan
        return f"{self.nivel} - {target} ({self.porcentaje}%)"

class ConsentRequest(models.Model):
    STATUS_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('ENVIADO', 'Enviado'),
        ('ABIERTO', 'Abierto'),
        ('FIRMADO', 'Firmado'),
        ('RECHAZADO', 'Rechazado'),
        ('EXPIRADO', 'Expirado'),
        ('ERROR', 'Error'),
    ]
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='consent_requests')
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='consent_requests')
    documento_generado = models.ForeignKey('Documento', on_delete=models.SET_NULL, null=True, blank=True, related_name='consent_results')
    
    provider_envelope_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='BORRADOR')
    
    signer_email = models.EmailField()
    signer_name = models.CharField(max_length=255)
    signing_url = models.URLField(max_length=1000, blank=True, null=True)
    
    sent_at = models.DateTimeField(null=True, blank=True)
    signed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    last_error = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='consents_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Consent {self.id} - {self.poliza.id_mercado} ({self.status})"

class ConsentEvent(models.Model):
    consent_request = models.ForeignKey(ConsentRequest, on_delete=models.CASCADE, related_name='events', null=True, blank=True)
    event_id = models.CharField(max_length=255, unique=True)
    event_type = models.CharField(max_length=100)
    payload = models.JSONField()
    processed_at = models.DateTimeField(auto_now_add=True)
    signature_valid = models.BooleanField(default=False)

    def __str__(self):
        return f"Event {self.event_id} ({self.event_type})"

# End of models

class Notificacion(models.Model):
    TIPO_CHOICES = [
        ('TAG', 'Etiquetado'),
        ('ASIGNACION', 'Asignación'),
        ('SEGURIDAD', 'Seguridad'),
        ('SISTEMA', 'Sistema'),
        ('RECORDATORIO', 'Recordatorio'),
    ]
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notificaciones')
    mensaje = models.CharField(max_length=255)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='SISTEMA')
    leida = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    # Generic relation
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"Notificación para {self.usuario.username}: {self.mensaje}"

def registrar_auditoria_global(usuario, accion, modelo, objeto_id=None, detalles=None, ip_address=None):
    AuditoriaGlobal.objects.create(
        usuario=usuario,
        accion=accion,
        modelo=modelo,
        objeto_id=str(objeto_id) if objeto_id is not None else None,
        detalles=detalles,
        ip_address=ip_address,
    )

@receiver(m2m_changed, sender=Nota.usuarios_etiquetados.through)
def notificar_etiqueta_nota(sender, instance, action, reverse, model, pk_set, **kwargs):
    if action == "post_add":
        for pk in pk_set:
            try:
                user = User.objects.get(pk=pk)
                # Avoid notifying self if needed, but requirements say "receive a notification when tagged"
                if user != instance.autor:
                    Notificacion.objects.create(
                        usuario=user,
                        mensaje=f"Has sido etiquetado en una nota de la póliza {instance.poliza.id_mercado}",
                        tipo='TAG',
                        content_object=instance
                    )
            except User.DoesNotExist:
                pass

@receiver(m2m_changed, sender=Poliza.colaboradores.through)
def notificar_colaborador_poliza(sender, instance, action, pk_set, **kwargs):
    if action == "post_add":
        for pk in pk_set:
            try:
                user = User.objects.get(pk=pk)
                Notificacion.objects.create(
                    usuario=user,
                    mensaje=f"Has sido asignado como colaborador en la póliza {instance.id_mercado}",
                    tipo='ASIGNACION',
                    content_object=instance
                )
            except User.DoesNotExist:
                pass

def _usuario_de_agente(agente):
    if not agente:
        return None
    profile = getattr(agente, 'user_profile', None)
    if profile and profile.user_id:
        return profile.user
    return None


@receiver(post_save, sender=CambioDeVida)
def notificar_cambio_de_vida(sender, instance, created, **kwargs):
    if not created:
        return

    poliza = instance.poliza
    mensaje = (
        f"Nuevo cambio de vida ({instance.get_tipo_display()}) "
        f"en la póliza {poliza.id_mercado}"
    )
    if instance.descripcion:
        mensaje = f"{mensaje}: {instance.descripcion[:120]}"

    agentes_a_notificar = []
    if instance.agente_creador_id:
        agentes_a_notificar.append(instance.agente_creador)
    if instance.agente_id and instance.agente_id != instance.agente_creador_id:
        agentes_a_notificar.append(instance.agente)

    usuarios_notificados = set()
    for agente in agentes_a_notificar:
        usuario = _usuario_de_agente(agente)
        if usuario and usuario.id not in usuarios_notificados:
            Notificacion.objects.create(
                usuario=usuario,
                mensaje=mensaje[:255],
                tipo='ASIGNACION',
                content_object=instance,
            )
            usuarios_notificados.add(usuario.id)


@receiver(post_save, sender=IntentoLoginFallido)
def notificar_login_fallido(sender, instance, created, **kwargs):
    if created:
        user = User.objects.filter(Q(username=instance.usuario_intentado) | Q(email=instance.usuario_intentado)).first()
        if user:
            Notificacion.objects.create(
                usuario=user,
                mensaje=f"Se detectó un intento de inicio de sesión fallido en tu cuenta desde IP {instance.ip_address or 'Desconocida'}",
                tipo='SEGURIDAD',
                content_object=instance
            )




# ==============================================================================
# AUDITORIA AUTOMATICA DE HISTORIAL DE PÓLIZAS
# ==============================================================================

@receiver(pre_save, sender=Poliza)
def poliza_pre_save_changes(sender, instance, **kwargs):
    if instance.pk:
        # Póliza existente, vamos a capturar cómo estaba antes
        try:
            old_instance = Poliza.objects.get(pk=instance.pk)
            instance._old_instance_state = old_instance
        except Poliza.DoesNotExist:
            instance._old_instance_state = None

@receiver(post_save, sender=Poliza)
def track_poliza_save(sender, instance, created, **kwargs):
    from api.middleware import get_current_user
    user = get_current_user()
    
    if getattr(instance, '_history_tracked', False):
        return
        
    if created:
        HistorialPoliza.objects.create(
            poliza=instance,
            usuario=user,
            accion='CREACION',
            detalles=f"Póliza creada (ID Mercado: {instance.id_mercado})"
        )
        registrar_auditoria_global(
            usuario=user,
            accion='CREACION',
            modelo='Poliza',
            objeto_id=instance.id,
            detalles=f"Creación de póliza {instance.id_mercado}"
        )
    else:
        old_instance = getattr(instance, '_old_instance_state', None)
        changes = []
        if old_instance:
            for field in instance._meta.fields:
                # Ignoramos campos que cambian automáticamente
                if field.name in ['ultima_actualizacion', 'created_at', 'updated_at']:
                    continue
                old_val = getattr(old_instance, field.name)
                new_val = getattr(instance, field.name)
                if old_val != new_val:
                    changes.append(f"{field.verbose_name or field.name}")
        
        if changes:
            detalles_str = "Campos actualizados: " + ", ".join(changes)
        else:
            detalles_str = "Póliza actualizada sin cambios observables en campos principales."
            
        HistorialPoliza.objects.create(
            poliza=instance,
            usuario=user,
            accion='EDICION',
            detalles=detalles_str
        )
        registrar_auditoria_global(
            usuario=user,
            accion='EDICION',
            modelo='Poliza',
            objeto_id=instance.id,
            detalles=detalles_str
        )
    
    instance._history_tracked = True

@receiver(post_save, sender=Nota)
def track_nota_save(sender, instance, created, **kwargs):
    if created and not getattr(instance, '_history_tracked', False):
        from api.middleware import get_current_user
        user = get_current_user()
        HistorialPoliza.objects.create(
            poliza=instance.poliza,usuario=user,accion='NOTA_AGREGADA',
            detalles=f"Nota agregada: {instance.contenido[:50]}..."
        )
        registrar_auditoria_global(
            usuario=user,
            accion='NOTA_AGREGADA',
            modelo='Nota',
            objeto_id=instance.id,
            detalles=f"Nota en póliza {instance.poliza.id_mercado}"
        )
        instance._history_tracked = True

@receiver(post_delete, sender=Nota)
def track_nota_delete(sender, instance, **kwargs):
    from api.middleware import get_current_user
    HistorialPoliza.objects.create(
        poliza=instance.poliza,usuario=get_current_user(),accion='NOTA_ELIMINADA',detalles="Nota eliminada"
    )
    registrar_auditoria_global(
        usuario=get_current_user(),
        accion='NOTA_ELIMINADA',
        modelo='Nota',
        objeto_id=instance.id,
        detalles=f"Nota eliminada de póliza {instance.poliza.id_mercado}"
    )

@receiver(post_save, sender=Documento)
def track_documento_save(sender, instance, created, **kwargs):
    if created and not getattr(instance, '_history_tracked', False):
        from api.middleware import get_current_user
        usuario = instance.subido_por or get_current_user()
        HistorialPoliza.objects.create(
            poliza=instance.poliza,
            usuario=usuario,
            accion='DOCUMENTO_SUBIDO',
            detalles=f"Documento subido: {instance.titulo}"
        )
        registrar_auditoria_global(
            usuario=usuario,
            accion='DOCUMENTO_SUBIDO',
            modelo='Documento',
            objeto_id=instance.id,
            detalles=f"Documento {instance.titulo} en póliza {instance.poliza.id_mercado}"
        )
        instance._history_tracked = True

@receiver(post_delete, sender=Documento)
def track_documento_delete(sender, instance, **kwargs):
    from api.middleware import get_current_user
    HistorialPoliza.objects.create(
        poliza=instance.poliza,usuario=get_current_user(),accion='DOCUMENTO_ELIMINADO',
        detalles=f"Documento eliminado: {instance.titulo}"
    )
    registrar_auditoria_global(
        usuario=get_current_user(),
        accion='DOCUMENTO_ELIMINADO',
        modelo='Documento',
        objeto_id=instance.id,
        detalles=f"Documento eliminado de póliza {instance.poliza.id_mercado}"
    )

@receiver(post_save, sender=Cita)
def track_cita_save(sender, instance, created, **kwargs):
    if created and not getattr(instance, '_history_tracked', False):
        from api.middleware import get_current_user
        HistorialPoliza.objects.create(
            poliza=instance.poliza,usuario=get_current_user(),accion='EDICION',
            detalles=f"Cita creada para {instance.fecha_hora.date()} en {getattr(instance, 'proveedor', 'proveedor')}"
        )
        instance._history_tracked = True

@receiver(post_save, sender=Recordatorio)
def track_recordatorio_save(sender, instance, created, **kwargs):
    if created and not getattr(instance, '_history_tracked', False):
        from api.middleware import get_current_user
        HistorialPoliza.objects.create(
            poliza=instance.poliza,usuario=get_current_user(),accion='EDICION',
            detalles=f"Recordatorio establecido: {instance.titulo} para {instance.fecha_vencimiento}"
        )
        instance._history_tracked = True

class ConfiguracionNotificacion(models.Model):
    TIPO_NOTIFICACION_CHOICES = [
        ('CONTRATO', 'Contratos'),
        ('PAGO', 'Recibos de Pago'),
        ('RENOVACION', 'Renovaciones'),
    ]
    tipo = models.CharField(max_length=20, choices=TIPO_NOTIFICACION_CHOICES, unique=True, verbose_name="Tipo de Notificación")
    asunto_en = models.CharField(max_length=255, verbose_name="Asunto (Inglés)", null=True, blank=True)
    asunto_es = models.CharField(max_length=255, verbose_name="Asunto (Español)", null=True, blank=True)
    cuerpo_en = models.TextField(verbose_name="Cuerpo del Correo (Inglés)", null=True, blank=True)
    cuerpo_es = models.TextField(verbose_name="Cuerpo del Correo (Español)", null=True, blank=True)
    grupos_destino = models.CharField(max_length=255, verbose_name="Grupos Destino", help_text="Separados por comas", null=True, blank=True)

    def __str__(self):
        return f"Config. Notificación: {self.get_tipo_display()}"
