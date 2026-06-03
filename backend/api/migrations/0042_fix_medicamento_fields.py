from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0041_cliente_condicion_medica_cliente_estatura_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='medicamento',
            name='frecuencia',
            field=models.CharField(max_length=100, null=True, blank=True, verbose_name='Frecuencia'),
        ),
        migrations.AddField(
            model_name='medicamento',
            name='fecha_inicio',
            field=models.DateField(null=True, blank=True, verbose_name='Fecha de Inicio'),
        ),
        migrations.AddField(
            model_name='medicamento',
            name='fecha_fin',
            field=models.DateField(null=True, blank=True, verbose_name='Fecha de Fin'),
        ),
        migrations.AddField(
            model_name='medicamento',
            name='activo',
            field=models.BooleanField(default=True, verbose_name='Activo'),
        ),
        migrations.AddField(
            model_name='medicamento',
            name='poliza',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='medicamentos', to='api.poliza', null=True),
        ),
    ]
