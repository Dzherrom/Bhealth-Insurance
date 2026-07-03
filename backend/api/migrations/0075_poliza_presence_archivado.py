from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0074_roles_departamentos'),
    ]

    operations = [
        migrations.AddField(
            model_name='poliza',
            name='archivada',
            field=models.BooleanField(default=False, verbose_name='Archivada'),
        ),
        migrations.AddField(
            model_name='poliza',
            name='archivada_en',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Fecha de archivado'),
        ),
        migrations.AddField(
            model_name='poliza',
            name='archivada_por',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='polizas_archivadas',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Archivada por',
            ),
        ),
        migrations.AddField(
            model_name='polizaviewer',
            name='mode',
            field=models.CharField(
                choices=[('VIEW', 'Solo lectura'), ('EDIT', 'Editando')],
                default='VIEW',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='polizaviewer',
            name='opened_at',
            field=models.DateTimeField(auto_now_add=True, verbose_name='Primera apertura'),
        ),
    ]
