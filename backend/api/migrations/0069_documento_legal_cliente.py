from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0068_merge_20260702_0133'),
    ]

    operations = [
        migrations.CreateModel(
            name='DocumentoLegalCliente',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(choices=[('ssn', 'Seguro Social (SSN)'), ('green_card', 'Green card'), ('permiso_trabajo', 'Permiso de trabajo'), ('pasaporte', 'Pasaporte'), ('licencia', 'Licencia de conducir')], max_length=30, verbose_name='Tipo de documento')),
                ('numero_documento', models.CharField(blank=True, default='', max_length=100, verbose_name='Número de documento')),
                ('fecha_emision', models.DateField(blank=True, null=True, verbose_name='Fecha de emisión')),
                ('activo', models.BooleanField(default=True)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_modificacion', models.DateTimeField(auto_now=True)),
                ('cliente', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='documentos_legales', to='api.cliente', verbose_name='Cliente')),
                ('documento', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='vinculos_legales', to='api.documento', verbose_name='Documento de la póliza')),
            ],
            options={
                'verbose_name': 'Documento legal del cliente',
                'verbose_name_plural': 'Documentos legales del cliente',
                'ordering': ['tipo'],
            },
        ),
        migrations.AddConstraint(
            model_name='documentolegalcliente',
            constraint=models.UniqueConstraint(fields=('cliente', 'tipo'), name='unique_cliente_tipo_documento_legal'),
        ),
    ]
