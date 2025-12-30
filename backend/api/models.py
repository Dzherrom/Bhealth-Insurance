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
    id_mercado = models.CharField(max_length=100, verbose_name="ID Mercado")
    id_miembro = models.CharField(max_length=100, verbose_name="ID Miembro")
    costo_poliza = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Costo Póliza")
    subsidio = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Subsidio")
    prima_mensual = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Prima Mensual")
    fecha_efectiva = models.DateField(verbose_name="Fecha Efectiva")
    estado = models.ForeignKey(EstadoPoliza, on_delete=models.SET_NULL, null=True, verbose_name="Estado")
    fecha_envio = models.DateField(verbose_name="Fecha Envío")
    fecha_cancelacion = models.DateField(null=True, blank=True, verbose_name="Fecha Cancelación")
    id_interno = models.CharField(max_length=100, verbose_name="ID Interno")
    ultima_actualizacion = models.DateTimeField(auto_now=True, verbose_name="Última Actualización")
    es_duplicado = models.BooleanField(default=False, verbose_name="Es Duplicado")
    ultimo_duplicado = models.CharField(max_length=100, blank=True, null=True, verbose_name="Último Duplicado")
    ffm_mercado = models.CharField(max_length=100, blank=True, null=True, verbose_name="FFM Usado en Mercado")
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
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='documentos')
    archivo = models.FileField(upload_to='documentos_poliza/', verbose_name="Archivo")
    titulo = models.CharField(max_length=255, verbose_name="Título del Documento")
    fecha_subida = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Subida")
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

# End of models

