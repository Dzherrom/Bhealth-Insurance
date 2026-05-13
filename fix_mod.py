import re

with open('backend/api/models.py', 'r', encoding='utf-8') as f:
    text = f.read()

# remove multiple class ConfiguracionNotificacion to avoid duplicates
text = re.sub(r'class ConfiguracionNotificacion\(models\.Model\):.*', '', text, flags=re.DOTALL)
text = text.strip() + '\n\n' + '''class ConfiguracionNotificacion(models.Model):
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
'''

with open('backend/api/models.py', 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed models.py')