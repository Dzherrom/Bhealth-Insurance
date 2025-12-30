from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

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
    apellido_paterno = models.CharField(max_length=100, verbose_name="Apellido Paterno")
    genero = models.CharField(max_length=20, verbose_name="Género")
    fecha_nacimiento = models.DateField(verbose_name="Fecha de Nacimiento")
    ssn = models.CharField(max_length=20, unique=True, verbose_name="SSN")
    email = models.EmailField(verbose_name="Email")
    telefono = models.CharField(max_length=20, verbose_name="Teléfono")
    ingreso_anual = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Ingreso Anual")
    estado_civil = models.CharField(max_length=50, verbose_name="Estado Civil")
    pais_nacimiento = models.CharField(max_length=100, verbose_name="País de Nacimiento")
    estado_inmigracion = models.CharField(max_length=100, verbose_name="Estado de Inmigración")

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
    agente = models.ForeignKey(Agente, on_delete=models.SET_NULL, null=True, related_name='polizas')
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='polizas')
    clientes = models.ManyToManyField(Cliente, through='PolizaCliente', related_name='polizas')

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
        ('USER', 'User'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='USER')
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

