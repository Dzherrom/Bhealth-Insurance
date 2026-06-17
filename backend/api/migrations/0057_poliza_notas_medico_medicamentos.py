from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0056_infopago_estado_pago'),
    ]

    operations = [
        migrations.AddField(
            model_name='poliza',
            name='notas_comentarios',
            field=models.TextField(blank=True, null=True, verbose_name='Notas o Comentarios'),
        ),
        migrations.AddField(
            model_name='poliza',
            name='info_medico_principal',
            field=models.TextField(blank=True, null=True, verbose_name='Información del Médico Principal'),
        ),
        migrations.AddField(
            model_name='poliza',
            name='medicamentos_necesarios',
            field=models.TextField(blank=True, null=True, verbose_name='Medicamentos Necesarios'),
        ),
    ]
