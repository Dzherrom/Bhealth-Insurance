# Generated manually to add commission configuration rules.
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0031_consentrequest_consentevent'),
    ]

    operations = [
        migrations.CreateModel(
            name='ConfiguracionComision',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nivel', models.CharField(choices=[('AGENCIA', 'Agencia'), ('PROVEEDOR', 'Proveedor'), ('PLAN', 'Plan')], max_length=20, verbose_name='Nivel')),
                ('porcentaje', models.DecimalField(decimal_places=2, max_digits=6, verbose_name='Porcentaje de Comisión')),
                ('activo', models.BooleanField(default=True)),
                ('descripcion', models.CharField(blank=True, max_length=255, null=True)),
                ('agencia', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='configuraciones_comision', to='api.agencia')),
                ('aseguradora', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='configuraciones_comision', to='api.aseguradora')),
                ('plan', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='configuraciones_comision', to='api.plan')),
            ],
        ),
    ]
