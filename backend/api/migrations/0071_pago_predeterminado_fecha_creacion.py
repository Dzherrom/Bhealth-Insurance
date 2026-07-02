from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0070_documentolegalcliente_fecha_vencimiento'),
    ]

    operations = [
        migrations.AddField(
            model_name='tarjetacredito',
            name='es_predeterminado',
            field=models.BooleanField(default=False, verbose_name='Predeterminado'),
        ),
        migrations.AddField(
            model_name='tarjetacredito',
            name='fecha_creacion',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now, verbose_name='Fecha de creación'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='cuentabancaria',
            name='es_predeterminado',
            field=models.BooleanField(default=False, verbose_name='Predeterminado'),
        ),
        migrations.AddField(
            model_name='cuentabancaria',
            name='fecha_creacion',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now, verbose_name='Fecha de creación'),
            preserve_default=False,
        ),
    ]
