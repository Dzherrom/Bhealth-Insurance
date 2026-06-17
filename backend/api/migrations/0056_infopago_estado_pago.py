from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0055_cliente_contacto_opcional'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE api_infopago "
                        "ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE';"
                    ),
                    reverse_sql="ALTER TABLE api_infopago DROP COLUMN IF EXISTS estado_pago;",
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='infopago',
                    name='estado_pago',
                    field=models.CharField(
                        choices=[
                            ('PENDIENTE', 'Pendiente'),
                            ('AL_DIA', 'Al día'),
                            ('VENCIDO', 'Vencido'),
                        ],
                        default='PENDIENTE',
                        max_length=50,
                        verbose_name='Estado de Pago',
                    ),
                ),
            ],
        ),
    ]
