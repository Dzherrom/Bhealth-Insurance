from django.db import migrations, models
import django.db.models.deletion


def copy_agente_to_registro(apps, schema_editor):
    Poliza = apps.get_model('api', 'Poliza')
    for poliza in Poliza.objects.filter(agente_registro__isnull=True, agente__isnull=False):
        poliza.agente_registro_id = poliza.agente_id
        poliza.save(update_fields=['agente_registro_id'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0064_alter_matrizpermisorol_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='poliza',
            name='agente_registro',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='polizas_registradas',
                to='api.agente',
                verbose_name='Agente que registró',
            ),
        ),
        migrations.RunPython(copy_agente_to_registro, migrations.RunPython.noop),
    ]
