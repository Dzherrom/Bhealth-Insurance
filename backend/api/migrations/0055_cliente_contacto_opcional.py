from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0054_cambio_de_vida_agentes'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cliente',
            name='email',
            field=models.EmailField(blank=True, null=True, verbose_name='Email'),
        ),
        migrations.AlterField(
            model_name='cliente',
            name='telefono',
            field=models.CharField(blank=True, max_length=20, null=True, verbose_name='Teléfono'),
        ),
    ]
