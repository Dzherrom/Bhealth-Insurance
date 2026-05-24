from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0039_merge_20260523_2150'),
    ]

    operations = [
        migrations.AlterField(
            model_name='poliza',
            name='fecha_efectiva',
            field=models.DateField(blank=True, null=True, verbose_name='Fecha Efectiva'),
        ),
    ]
