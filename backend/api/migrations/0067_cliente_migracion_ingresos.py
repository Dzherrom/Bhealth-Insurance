from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0066_recordatorio_notificaciones'),
    ]

    operations = [
        migrations.AddField(
            model_name='cliente',
            name='idioma_preferido',
            field=models.CharField(blank=True, default='ES', max_length=20, null=True, verbose_name='Idioma preferido'),
        ),
        migrations.AddField(
            model_name='cliente',
            name='numero_naturalizacion',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='Número de naturalización'),
        ),
        migrations.AddField(
            model_name='cliente',
            name='numero_uscis',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='Número USCIS'),
        ),
        migrations.AddField(
            model_name='polizacliente',
            name='es_aplicante',
            field=models.BooleanField(default=False, verbose_name='Es aplicante'),
        ),
        migrations.CreateModel(
            name='IngresoEmpleador',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre_empleador', models.CharField(blank=True, default='', max_length=255, verbose_name='Nombre del empleador')),
                ('telefono_empleador', models.CharField(blank=True, default='', max_length=30, verbose_name='Teléfono del empleador')),
                ('cargo_ocupacion', models.CharField(blank=True, default='', max_length=255, verbose_name='Cargo / Ocupación')),
                ('ingreso_anual', models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='Ingreso anual')),
                ('ingreso_mensual', models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='Ingreso mensual')),
                ('activo', models.BooleanField(default=True)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('cliente', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ingresos_empleador', to='api.cliente', verbose_name='Cliente')),
            ],
            options={
                'verbose_name': 'Ingreso por empleador',
                'verbose_name_plural': 'Ingresos por empleador',
                'ordering': ['-fecha_creacion'],
            },
        ),
    ]
