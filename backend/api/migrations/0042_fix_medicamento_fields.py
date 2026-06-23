from django.db import migrations


class Migration(migrations.Migration):
    """
    No-op: api_medicamento was already created with frecuencia, fecha_inicio,
    fecha_fin, activo and poliza in 0020_medicamento. Re-adding those columns
    caused DuplicateColumn errors on PostgreSQL during deploy.
    """

    dependencies = [
        ('api', '0041_cliente_condicion_medica_cliente_estatura_and_more'),
    ]

    operations = []
