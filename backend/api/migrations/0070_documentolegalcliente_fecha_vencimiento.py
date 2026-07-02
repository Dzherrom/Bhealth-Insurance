from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0069_documento_legal_cliente'),
    ]

    operations = [
        migrations.AddField(
            model_name='documentolegalcliente',
            name='fecha_vencimiento',
            field=models.DateField(blank=True, null=True, verbose_name='Fecha de vencimiento'),
        ),
    ]
