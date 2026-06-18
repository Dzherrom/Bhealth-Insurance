from django.db import migrations, models


def migrate_legacy_medico_medicamento_data(apps, schema_editor):
    Poliza = apps.get_model('api', 'Poliza')
    MedicoPoliza = apps.get_model('api', 'MedicoPoliza')
    Medicamento = apps.get_model('api', 'Medicamento')

    for poliza in Poliza.objects.all():
        if (
            poliza.info_medico_principal
            or poliza.medico_especializacion
            or poliza.medico_hospital
        ) and not MedicoPoliza.objects.filter(poliza=poliza).exists():
            MedicoPoliza.objects.create(
                poliza=poliza,
                nombre=poliza.info_medico_principal or 'Médico principal',
                especializacion=poliza.medico_especializacion,
                hospital=poliza.medico_hospital,
            )

        if (poliza.medicamentos_necesarios or poliza.medicamentos_dosis) and not Medicamento.objects.filter(poliza=poliza).exists():
            Medicamento.objects.create(
                poliza=poliza,
                nombre=poliza.medicamentos_necesarios or 'Medicamento',
                dosis=poliza.medicamentos_dosis,
            )


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0059_poliza_medico_medicamentos_campos'),
    ]

    operations = [
        migrations.CreateModel(
            name='MedicoPoliza',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.TextField(verbose_name='Nombre / Información del médico')),
                ('especializacion', models.CharField(blank=True, max_length=255, null=True, verbose_name='Especialización')),
                ('hospital', models.CharField(blank=True, max_length=255, null=True, verbose_name='Hospital')),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')),
                ('poliza', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='medicos_principales', to='api.poliza', verbose_name='Póliza')),
            ],
            options={
                'verbose_name': 'Médico de póliza',
                'verbose_name_plural': 'Médicos de póliza',
                'ordering': ['fecha_creacion', 'id'],
            },
        ),
        migrations.RunPython(migrate_legacy_medico_medicamento_data, migrations.RunPython.noop),
    ]
