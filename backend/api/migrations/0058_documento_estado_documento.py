from django.db import migrations, models


def sync_estado_documento_column(apps, schema_editor):
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'api_documento'
              AND column_name = 'estado_documento'
            """
        )
        column_exists = cursor.fetchone() is not None

        if column_exists:
            cursor.execute(
                """
                UPDATE api_documento
                SET estado_documento = 'SUBIDO'
                WHERE estado_documento IS NULL OR estado_documento = ''
                """
            )
            cursor.execute(
                """
                ALTER TABLE api_documento
                ALTER COLUMN estado_documento SET DEFAULT 'SUBIDO'
                """
            )
        else:
            cursor.execute(
                """
                ALTER TABLE api_documento
                ADD COLUMN estado_documento varchar(50) NOT NULL DEFAULT 'SUBIDO'
                """
            )


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0057_poliza_notas_medico_medicamentos'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name='documento',
                    name='estado_documento',
                    field=models.CharField(
                        choices=[
                            ('SUBIDO', 'Subido'),
                            ('PENDIENTE_REVISION', 'Pendiente de revisión'),
                            ('APROBADO', 'Aprobado'),
                            ('RECHAZADO', 'Rechazado'),
                        ],
                        default='SUBIDO',
                        max_length=50,
                        verbose_name='Estado del Documento',
                    ),
                ),
            ],
            database_operations=[
                migrations.RunPython(sync_estado_documento_column, migrations.RunPython.noop),
            ],
        ),
    ]
