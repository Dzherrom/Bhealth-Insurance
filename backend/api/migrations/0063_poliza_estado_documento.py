from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0062_userprofile_cliente_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='poliza',
            name='estado_documento',
            field=models.CharField(
                choices=[
                    ('PENDIENTE', 'Pendiente'),
                    ('EN_REVISION', 'En revisión'),
                    ('RECIBIDO', 'Recibido'),
                    ('APROBADO', 'Aprobado'),
                    ('RECHAZADO', 'Rechazado'),
                ],
                default='PENDIENTE',
                max_length=50,
                verbose_name='Estado de Documentación',
            ),
        ),
    ]
