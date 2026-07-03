from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0071_pago_predeterminado_fecha_creacion'),
    ]

    operations = [
        migrations.AddField(
            model_name='medicopoliza',
            name='es_principal',
            field=models.BooleanField(default=False, verbose_name='Médico principal'),
        ),
        migrations.AddField(
            model_name='medicamento',
            name='duracion_tratamiento',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='Duración del tratamiento'),
        ),
    ]
