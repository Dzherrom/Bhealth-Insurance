from django.db import migrations

def populate_more_estados(apps, schema_editor):
    EstadoPoliza = apps.get_model('api', 'EstadoPoliza')
    nuevos_estados = [
        'robado (etiqueta de aviso)', 'seguimiento no contactado', 
        'select health (sin NPN) 2026', 'select health (sin NPN) sometido 2026', 
        'select health (sin NPN) verificado', 'sometida jesus sudque 2026', 
        'sometida lorena carneiro 2026', 'sometida marco paredes 2026', 
        'sometida mariana paredes 2026', 'sometida romer castellano 2026', 
        'sometida wilmary briceno 2026', 'sometidfa yenny paredes 2026', 
        'three way 2026', 'venta nueva 2026', 'venta nueva jesus 2026', 
        'venta nueva lorena 2026', 'venta nueva marco 2026', 
        'venta nueva mariana 2026', 'venta nueva romer 2026', 
        'venta nueva wilmary 2026', 'venta nueva - tree way', 
        'venta nueva yenny 2026', 'completed', 'migrated', 'new', 
        'pending document', 'pending payment', 'quote', 'renewed', 
        'updated by client', 'waiting for approval', 'waiting on agent'
    ]
    
    for nombre in nuevos_estados:
        EstadoPoliza.objects.get_or_create(nombre=nombre)

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_populate_estados_poliza'),
    ]

    operations = [
        migrations.RunPython(populate_more_estados),
    ]
