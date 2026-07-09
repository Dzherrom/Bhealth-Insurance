from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0075_poliza_presence_archivado'),
    ]

    operations = [
        migrations.AlterField(
            model_name='etiqueta',
            name='nombre',
            field=models.CharField(max_length=100, verbose_name='Nombre Etiqueta'),
        ),
        migrations.AddConstraint(
            model_name='etiqueta',
            constraint=models.UniqueConstraint(
                fields=('nombre', 'tipo'),
                name='unique_etiqueta_nombre_por_tipo',
            ),
        ),
    ]
