from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import re

class Agencia(models.Model):
    nombre = models.CharField(max_length=255, verbose_name="Nombre Agencia")

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
    email = models.EmailField(verbose_name="Email")
    telefono = models.CharField(max_length=20, verbose_name="Teléfono")
    ingreso_anual = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Ingreso Anual")
    estado_civil = models.CharField(max_length=50, verbose_name="Estado Civil")
    pais_nacimiento = models.CharField(max_length=100, verbose_name="País de Nacimiento")
    estado_inmigracion = models.CharField(max_length=100, verbose_name="Estado de Inmigración")
    categoria_inmigracion = models.CharField(max_length=100, blank=True, null=True, verbose_name="Categoría de Inmigración")

    def __str__(self):
        return f"{self.primer_nombre} {self.apellido_paterno}"

class Aseguradora(models.Model):
    nombre = models.CharField(max_length=255, verbose_name="Nombre Aseguradora")

    def __str__(self):
        return self.nombre

class Plan(models.Model):
    id_plan_aseguradora = models.CharField(max_length=100, verbose_name="ID Plan Aseguradora")
    nombre = models.CharField(max_length=255, verbose_name="Nombre Plan")
    aseguradora = models.ForeignKey(Aseguradora, on_delete=models.CASCADE, related_name='planes')

    def __str__(self):
        return self.nombre

class EstadoPoliza(models.Model):
    nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre Estado")

    def __str__(self):
        return self.nombre

class Poliza(models.Model):
    TIPO_INSCRIPCION_CHOICES = [
        ('NUEVA', 'Nueva Venta'),
        ('RENOVACION', 'Renovación'),
    ]

    id_mercado = models.CharField(max_length=100, verbose_name="ID Mercado")
    id_miembro = models.CharField(max_length=100, verbose_name="ID Miembro")
    costo_poliza = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Costo Póliza")
    subsidio = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Subsidio")
    prima_mensual = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Prima Mensual")
    total_ahorros = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Total Ahorros")
    plan_era = models.CharField(max_length=255, blank=True, null=True, verbose_name="El Plan Era (Calculado)")
    
    fecha_efectiva = models.DateField(verbose_name="Fecha Efectiva")
    estado = models.ForeignKey(EstadoPoliza, on_delete=models.SET_NULL, null=True, verbose_name="Estado")
    fecha_envio = models.DateField(verbose_name="Fecha Envío")
    fecha_cancelacion = models.DateField(null=True, blank=True, verbose_name="Fecha Cancelación")
    id_interno = models.CharField(max_length=100, verbose_name="ID Interno")
    ultima_actualizacion = models.DateTimeField(auto_now=True, verbose_name="Última Actualización")
    es_duplicado = models.BooleanField(default=False, verbose_name="Es Duplicado")
    ultimo_duplicado = models.CharField(max_length=100, blank=True, null=True, verbose_name="Último Duplicado")
    
    ffm_mercado = models.CharField(max_length=100, blank=True, null=True, verbose_name="FFM Usado en Mercado")
    npn_mercado = models.CharField(max_length=50, blank=True, null=True, verbose_name="NPN Mercado")
    tipo_inscripcion = models.CharField(max_length=20, choices=TIPO_INSCRIPCION_CHOICES, blank=True, null=True, verbose_name="Tipo Inscripción")
    razon_inscripcion_especial = models.CharField(max_length=255, blank=True, null=True, verbose_name="Razón Inscripción Especial")
    fecha_inscripcion_especial = models.DateField(null=True, blank=True, verbose_name="Fecha Inscripción Especial")
    
    # Information Totals
    total_miembros = models.IntegerField(default=0, verbose_name="Total Miembros")
    total_aplicantes = models.IntegerField(default=0, verbose_name="Total Aplicantes")
    total_dependientes = models.IntegerField(default=0, verbose_name="Total Dependientes")
    
    # Addresses (Linked to Policy)
    direccion_fisica = models.ForeignKey(Direccion, on_delete=models.SET_NULL, null=True, blank=True, related_name='poliza_fisica', verbose_name="Dirección Física")
    direccion_postal = models.ForeignKey(Direccion, on_delete=models.SET_NULL, null=True, blank=True, related_name='poliza_postal', verbose_name="Dirección Postal")
    direccion_facturacion = models.ForeignKey(Direccion, on_delete=models.SET_NULL, null=True, blank=True, related_name='poliza_facturacion', verbose_name="Dirección Facturación")

    agente = models.ForeignKey(Agente, on_delete=models.SET_NULL, null=True, related_name='polizas')
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='polizas')
    clientes = models.ManyToManyField(Cliente, through='PolizaCliente', related_name='polizas')
    colaboradores = models.ManyToManyField(User, related_name='polizas_colaboracion', blank=True, verbose_name="Colaboradores")

    def __str__(self):
        return self.id_mercado

class PolizaCliente(models.Model):
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    es_solicitante_principal = models.BooleanField(default=False, verbose_name="Es Solicitante Principal")
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
        ('AGENT_L1', 'Agent Level 1'),
        ('AGENT_L2', 'Agent Level 2'),
        ('AGENT_L3', 'Agent Level 3'),
        ('AGENT', 'Agent'),
        ('RECRUITER', 'Recruiter'),
        ('CANDIDATE', 'Candidate'),
        ('ACCOUNTANT', 'Accountant'),
        ('USER', 'User'),
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
    agente = models.OneToOneField(Agente, on_delete=models.SET_NULL, null=True, blank=True, related_name='user_profile')

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

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

class HistorialPoliza(models.Model):
    ACCION_CHOICES = [
        ('CREACION', 'Creación'),
        ('EDICION', 'Edición'),
        ('ELIMINACION', 'Eliminación'),
        ('NOTA_AGREGADA', 'Nota/Archivo Agregado'),
        ('NOTA_ELIMINADA', 'Nota/Archivo Eliminado'),
        ('DOCUMENTO_SUBIDO', 'Documento Subido'),
        ('DOCUMENTO_ELIMINADO', 'Documento Eliminado'),
    ]
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='historial')
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    accion = models.CharField(max_length=20, choices=ACCION_CHOICES)
    detalles = models.TextField(blank=True, null=True)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_accion_display()} en {self.poliza} por {self.usuario}"

class Etiqueta(models.Model):
    nombre = models.CharField(max_length=50, unique=True, verbose_name="Nombre Etiqueta")
    color = models.CharField(max_length=7, default="#FFFFFF", verbose_name="Color Hex")

    def __str__(self):
        return self.nombre

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
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='documentos')
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True, related_name='documentos', verbose_name="Cliente")
    archivo = models.FileField(upload_to='documentos_poliza/', verbose_name="Archivo")
    titulo = models.CharField(max_length=255, verbose_name="Título del Documento")
    fecha_subida = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Subida")
    fecha_vencimiento = models.DateField(null=True, blank=True, verbose_name="Fecha de Vencimiento")
    categoria = models.CharField(max_length=50, choices=CATEGORIA_CHOICES, default='OTRO', verbose_name="Categoría")
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

class InfoPago(models.Model):
    poliza = models.OneToOneField(Poliza, on_delete=models.CASCADE, related_name='info_pago', verbose_name="Póliza")
    pago_recurrente = models.BooleanField(default=False, verbose_name="Pago Recurrente")
    fecha_primer_pago = models.DateField(null=True, blank=True, verbose_name="Fecha Primer Pago")
    dia_pago_preferido = models.IntegerField(null=True, blank=True, verbose_name="Día de Pago Preferido (1-31)")

    def __str__(self):
        return f"Pago Info {self.poliza}"

class TarjetaCredito(models.Model):
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='tarjetas_credito', verbose_name="Póliza")
    tipo_tarjeta = models.CharField(max_length=50, verbose_name="Tipo de Tarjeta")
    numero = models.CharField(max_length=100, verbose_name="Número de Tarjeta (Enmascarado)")
    nombre_titular = models.CharField(max_length=255, verbose_name="Nombre Titular")
    cvv = models.CharField(max_length=10, verbose_name="CVV")
    fecha_vencimiento = models.CharField(max_length=10, verbose_name="Fecha Vencimiento (MM/YY)")

    def __str__(self):
        return f"{self.tipo_tarjeta} *{self.numero[-4:]}"

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
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='recordatorios', verbose_name="Póliza")
    titulo = models.CharField(max_length=255, verbose_name="Para qué es este recordatorio")
    fecha_vencimiento = models.DateField(verbose_name="Fecha de Vencimiento")
    hora_vencimiento = models.TimeField(verbose_name="Hora de Vencimiento")
    zona_horaria = models.CharField(max_length=50, default="UTC", verbose_name="Zona Horaria")
    establecer_recordatorio = models.BooleanField(default=True, verbose_name="Establecer Recordatorio")
    usuario_notificar = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recordatorios_asignados', verbose_name="Quién debe ser notificado")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción o Comentarios")
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Recordatorio: {self.titulo} - {self.fecha_vencimiento}"

# End of models

