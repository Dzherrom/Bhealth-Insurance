from django.db import migrations

def populate_estados(apps, schema_editor):
    EstadoPoliza = apps.get_model('api', 'EstadoPoliza')
    estados = [
        'bill en proceso', 'bills', 'bills resuelto', 'cambio de vida', 
        'cambio de vida - tree way', 'cambio no realizado', 'cambio realizado sherpa', 
        'cancelado (etiqueta de aviso)', 'cita ginecologica', 'cita no procesada', 
        'cita procesada', 'citas', 'contactado', 'contactado jesus duque 2026', 
        'contactado lorena carneiro 2026', 'contactado marco paredes 2026', 
        'contactado romero castellano 2026', 'contactado wilmary briceno 2026', 
        'contactado yenny paredes 2026', 'cotizada 2026', 'new 2025', 'no contactado', 
        'no renovacion', 'nueva inscripcion ccs', 'nueva inscripcion mgta', 
        'poliza del 2024', 'preparado three way 2026', 'prospecto cliente renovacion 2026', 
        'renovacion no aprobada', 'renovacion no aprobada (sherpa)', 
        'renovacion verificada jesus 2026', 'renovacion verificada lorena 2026', 
        'renovacion verificada marco 2026', 'renovacion verificada mariana 2026', 
        'renovacion verificada  ormer 2026', 'renovacion verificada wilmary 2026', 
        'renovacion verificada yenny 2026', 'renovada jesus duque 2026', 
        'renovada lorena carneiro 2026', 'renovada marco paredes 2026', 
        'renovada mariana paredes 2026', 'renovada romer castellano 2026', 
        'renovada wilmary birceno 2026', 'renovada yenny paredes 2026'
    ]
    
    for nombre in estados:
        EstadoPoliza.objects.get_or_create(nombre=nombre)

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_estadopoliza_alter_poliza_estado'),
    ]

    operations = [
        migrations.RunPython(populate_estados),
    ]
