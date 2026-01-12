from django.db import migrations

def populate_licencias(apps, schema_editor):
    Agente = apps.get_model('api', 'Agente')
    Agencia = apps.get_model('api', 'Agencia')
    Aseguradora = apps.get_model('api', 'Aseguradora')
    Licencia = apps.get_model('api', 'Licencia')

    # Ensure a default agency exists
    agencia, _ = Agencia.objects.get_or_create(nombre="Agencia General")

    data = [
        {
            "agent": "Yenny",
            "year": 2026,
            "licenses": [
                { "state": "Alabama", "carriers": ["Ambetter", "United"] },
                { "state": "Arizona", "carriers": ["Ambetter", "Oscar", "United"] },
                { "state": "Kansas", "carriers": ["Ambetter", "Oscar", "United"] },
                { "state": "Louisiana", "carriers": ["Ambetter", "United"] },
                { "state": "Michigan", "carriers": ["Ambetter", "Oscar", "United"] },
                { "state": "Nebraska", "carriers": ["Ambetter", "Oscar", "United"] },
                { "state": "Oklahoma", "carriers": ["Ambetter", "Oscar", "United"] },
                { "state": "Virginia", "carriers": ["Anthem", "Oscar", "United"] },
                { "state": "Ohio", "carriers": ["Ambetter", "Oscar", "United"] },
                { "state": "Utah", "carriers": ["Imperial", "Cigna"] },
                { "state": "Colorado", "carriers": ["Anthem", "United", "Cigna"] },
                { "state": "Indiana", "carriers": ["Ambetter", "Anthem", "United"] },
                { "state": "South Carolina", "carriers": ["Ambetter", "United", "Amerihealth"] },
                { "state": "Texas", "carriers": ["Ambetter", "Oscar", "Wellpoint", "United", "Cigna"] },
                { "state": "North Carolina", "carriers": ["Ambetter", "Oscar", "United", "Amerihealth"] },
                { "state": "Georgia", "carriers": ["Ambetter", "Oscar", "Anthem", "United", "Cigna"] },
                { "state": "Tennessee", "carriers": ["Ambetter", "Oscar", "United"] },
                { "state": "Illinois", "carriers": ["Ambetter", "Oscar", "United"] },
                { "state": "Florida", "carriers": ["Ambetter", "Oscar", "Wellpoint", "United", "Amerihealth", "Cigna"] }
            ]
        },
        {
            "agent": "Marco",
            "year": 2026,
            "licenses": [
                { "state": "Georgia", "carriers": ["Ambetter", "Oscar", "United"] },
                { "state": "Illinois", "carriers": ["Ambetter", "Oscar", "United"] },
                { "state": "Tennessee", "carriers": ["Ambetter", "Oscar", "United"] },
                { "state": "North Carolina", "carriers": ["Ambetter", "Oscar", "United"] },
                { "state": "Utah", "carriers": ["Imperial"] },
                { "state": "Texas", "carriers": ["Ambetter", "Oscar", "Anthem", "Wellpoint", "United"] },
                { "state": "Florida", "carriers": ["Ambetter", "Anthem", "Wellpoint", "United"] }
            ]
        },
        {
            "agent": "Wilmary",
            "year": 2026,
            "licenses": [
                { "state": "Utah", "carriers": ["Imperial"] },
                { "state": "Texas", "carriers": ["Ambetter (Pending)", "Oscar", "Anthem", "Wellpoint", "Harbor"] },
                { "state": "Florida", "carriers": ["Ambetter (Pending)", "Oscar", "Wellpoint"] }
            ]
        },
        {
            "agent": "Mariana",
            "year": 2026,
            "licenses": [
                { "state": "Utah", "carriers": ["Imperial"] }
            ]
        },
        {
            "agent": "Romer",
            "year": 2026,
            "licenses": [
                { "state": "Utah", "carriers": ["Imperial"] },
                { "state": "Florida", "carriers": ["Ambetter", "Oscar", "United"] },
                { "state": "Texas", "carriers": ["Ambetter", "Oscar", "United", "Blue Cross", "Harbor"] }
            ]
        },
        {
            "agent": "Jesus",
            "year": 2026,
            "licenses": [
                { "state": "Utah", "carriers": ["Regence (Blue Cross)"] }
            ]
        },
        {
            "agent": "Lorena",
            "year": 2026,
            "licenses": [
                { "state": "Florida", "carriers": ["Ambetter", "Oscar"] },
                { "state": "Texas", "carriers": ["Ambetter", "Oscar"] },
                { "state": "Utah", "carriers": ["Imperial"] },
                { "state": "South Carolina", "carriers": ["Ambetter", "Oscar"] }
            ]
        }
    ]

    for entry in data:
        agent_name = entry["agent"]
        year = entry["year"]
        
        # Find or create agent
        # Assuming NPN is unique, we generate a dummy one if creating
        agente, created = Agente.objects.get_or_create(
            nombre_completo__icontains=agent_name,
            defaults={
                'nombre_completo': agent_name,
                'npn': f"NPN-{agent_name.upper()}",
                'agencia': agencia
            }
        )
        
        # If multiple agents match, pick the first one (this is a simplification)
        if not created and isinstance(agente, list): 
             # get_or_create returns object, created. But if filter was used it would be different.
             # Here we used get_or_create with kwargs, so it returns one object.
             # However, if we want to search by partial name, we should filter first.
             pass

        # Let's refine agent lookup to be safer
        agentes = Agente.objects.filter(nombre_completo__icontains=agent_name)
        if agentes.exists():
            agente = agentes.first()
        else:
            agente = Agente.objects.create(
                nombre_completo=agent_name,
                npn=f"NPN-{agent_name.upper()}",
                agencia=agencia
            )

        for lic in entry["licenses"]:
            state = lic["state"]
            carriers = lic["carriers"]
            
            licencia, _ = Licencia.objects.get_or_create(
                agente=agente,
                anio=year,
                estado=state
            )
            
            for carrier_name in carriers:
                aseguradora, _ = Aseguradora.objects.get_or_create(nombre=carrier_name)
                licencia.aseguradoras.add(aseguradora)

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_licencia'),
    ]

    operations = [
        migrations.RunPython(populate_licencias),
    ]
