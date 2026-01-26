# Generated manually

from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0025_notificacion'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tarjetacredito',
            name='numero',
            field=models.CharField(max_length=500, verbose_name='Número de Tarjeta (Enmascarado)'),
        ),
        migrations.AlterField(
            model_name='tarjetacredito',
            name='cvv',
            field=models.CharField(max_length=100, verbose_name='CVV'),
        ),
    ]
