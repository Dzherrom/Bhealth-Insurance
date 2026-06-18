from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0058_documento_estado_documento'),
    ]

    operations = [
        migrations.AddField(
            model_name='poliza',
            name='medico_especializacion',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='Especialización del Médico'),
        ),
        migrations.AddField(
            model_name='poliza',
            name='medico_hospital',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='Hospital del Médico'),
        ),
        migrations.AddField(
            model_name='poliza',
            name='medicamentos_dosis',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='Dosis de Medicamentos'),
        ),
    ]
