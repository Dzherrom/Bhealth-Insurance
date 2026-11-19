from django.db import migrations, models
from django.db.models.functions import Lower, Trim


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0076_etiqueta_unique_nombre_por_tipo"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="agente",
            constraint=models.UniqueConstraint(
                Lower(Trim("nombre_completo")),
                name="unique_agente_nombre_normalized",
            ),
        ),
    ]
