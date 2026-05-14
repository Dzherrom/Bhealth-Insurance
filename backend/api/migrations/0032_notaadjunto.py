from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0031_consentrequest_consentevent'),
    ]

    operations = [
        migrations.CreateModel(
            name='NotaAdjunto',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('archivo', models.FileField(upload_to='notas_archivos/', verbose_name='Archivo Adjunto')),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')),
                ('nota', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='adjuntos', to='api.nota')),
            ],
        ),
    ]
