from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def migrate_legacy_privacy(apps, schema_editor):
    Recordatorio = apps.get_model('api', 'Recordatorio')
    # Antes es_privado se infería de establecer_recordatorio=False en el frontend.
    Recordatorio.objects.filter(establecer_recordatorio=False).update(es_privado=True)


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0065_poliza_agente_registro'),
    ]

    operations = [
        migrations.AddField(
            model_name='recordatorio',
            name='antelacion',
            field=models.CharField(
                choices=[
                    ('30m', '30 minutos antes'),
                    ('1h', '1 hora antes'),
                    ('2h', '2 horas antes'),
                    ('1d', '1 día antes'),
                    ('3d', '3 días antes'),
                    ('7d', '7 días antes'),
                ],
                default='1h',
                max_length=4,
                verbose_name='Notificar con antelación',
            ),
        ),
        migrations.AddField(
            model_name='recordatorio',
            name='creado_por',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='recordatorios_creados',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Creado por',
            ),
        ),
        migrations.AddField(
            model_name='recordatorio',
            name='es_privado',
            field=models.BooleanField(default=False, verbose_name='Recordatorio privado'),
        ),
        migrations.AddField(
            model_name='recordatorio',
            name='fecha_notificacion',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Fecha de notificación'),
        ),
        migrations.AddField(
            model_name='recordatorio',
            name='motivo',
            field=models.CharField(blank=True, default='', max_length=255, verbose_name='Motivo'),
        ),
        migrations.AddField(
            model_name='recordatorio',
            name='notificado',
            field=models.BooleanField(default=False, verbose_name='Notificación enviada'),
        ),
        migrations.AddField(
            model_name='recordatorio',
            name='tipo',
            field=models.CharField(
                choices=[
                    ('ESTADO_MIGRATORIO', 'Estado migratorio'),
                    ('VERIFICACION_INGRESOS', 'Verificación de ingresos'),
                    ('REALIZAR_PAGO', 'Realizar pago'),
                    ('CARGAR_DOCUMENTOS', 'Cargar documentos'),
                    ('ACTUALIZAR_INFO_CLIENTE', 'Actualizar información del cliente'),
                    ('OTRO', 'Otro'),
                ],
                default='OTRO',
                max_length=40,
                verbose_name='Tipo de recordatorio',
            ),
        ),
        migrations.AlterField(
            model_name='recordatorio',
            name='establecer_recordatorio',
            field=models.BooleanField(default=True, verbose_name='Enviar notificación automática'),
        ),
        migrations.AlterModelOptions(
            name='recordatorio',
            options={'ordering': ['fecha_vencimiento', 'hora_vencimiento']},
        ),
        migrations.RunPython(migrate_legacy_privacy, migrations.RunPython.noop),
    ]
