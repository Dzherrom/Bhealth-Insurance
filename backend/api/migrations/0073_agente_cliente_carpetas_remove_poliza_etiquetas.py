from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0072_medico_principal_medicamento_duracion'),
    ]

    operations = [
        migrations.AddField(
            model_name='cliente',
            name='agente',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='clientes',
                to='api.agente',
                verbose_name='Agente asignado',
            ),
        ),
        migrations.CreateModel(
            name='CarpetaDocumento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=255, verbose_name='Nombre de carpeta')),
                ('codigo', models.CharField(blank=True, default='', max_length=50, verbose_name='Código interno')),
                ('es_personalizada', models.BooleanField(default=True, verbose_name='Carpeta personalizada')),
                ('orden', models.PositiveIntegerField(default=0, verbose_name='Orden')),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')),
                (
                    'poliza',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='carpetas_documentos',
                        to='api.poliza',
                        verbose_name='Póliza',
                    ),
                ),
            ],
            options={
                'verbose_name': 'Carpeta de documentos',
                'verbose_name_plural': 'Carpetas de documentos',
                'ordering': ['orden', 'nombre'],
            },
        ),
        migrations.AddField(
            model_name='documento',
            name='carpeta',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='documentos',
                to='api.carpetadocumento',
                verbose_name='Carpeta',
            ),
        ),
        migrations.AddConstraint(
            model_name='carpetadocumento',
            constraint=models.UniqueConstraint(
                fields=('poliza', 'nombre'),
                name='unique_carpeta_nombre_por_poliza',
            ),
        ),
        migrations.RemoveField(
            model_name='poliza',
            name='etiquetas',
        ),
    ]
